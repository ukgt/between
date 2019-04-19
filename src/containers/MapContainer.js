import React, { Component } from "react";
import GoogleMapReact from "google-map-react";
import MapAutoComplete from "../components/MapAutoComplete";
import MapMarker from "../components/MapMarker";
import PlaceCard from "../components/PlaceCard";
import ConstraintSlider from "../components/ConstraintSlider";

import { Button, Input, Divider, message } from "antd";
require("dotenv").config();

const USA_COOR = { lat: 37.09024, lng: -95.712891 };

class MapsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSearchInput: "",
      constraints: [{ name: "", time: 0 }],
      searchResults: [],
      mapsLoaded: false,
      markers: [],
      map: {},
      mapsApi: {},
      americaLatLng: {},
      autoCompleteService: {},
      placesService: {},
      geoCoderService: {},
      directionService: {},
    };
  }

  // Update name for constraint with index === key
  updateConstraintName = (event, key) => {
    event.preventDefault();
    this.setState({ currentSearchInput: event.target.value }, () => {
      console.log(this.state.currentSearchInput);
    });
    // const prevConstraints = this.state.constraints;
    // const constraints = Object.assign([], prevConstraints);
    // constraints[key].name = event.target.value;
    // this.setState({ constraints });
  };

  // Updates distance (in KM) for constraint with index == key
  updateConstraintTime = (key, value) => {
    const prevConstraints = this.state.constraints;
    const constraints = Object.assign([], prevConstraints);
    constraints[key].time = value;
    this.setState({ constraints });
  };

  // Adds a Marker to the GoogleMaps component
  addMarker = (lat, lng, name) => {
    const prevMarkers = this.state.markers;
    const markers = Object.assign([], prevMarkers);

    // If name already exists in marker list just replace lat & lng.
    let newMarker = true;
    for (let i = 0; i < markers.length; i++) {
      if (markers[i].name === name) {
        newMarker = false;
        markers[i].lat = lat;
        markers[i].lng = lng;
        message.success(`Updated "${name}" Marker`);
        break;
      }
    }
    // Name does not exist in marker list. Create new marker
    if (newMarker) {
      markers.push({ lat, lng, name });
      message.success(`Added new "${name}" Marker`);
    }

    this.setState({ markers });
  };

  // Runs once when the Google Maps library is ready
  // Initializes all services that we need
  apiHasLoaded = (map, mapsApi) => {
    this.setState({
      mapsLoaded: true,
      map,
      mapsApi,
      americaLatLng: new mapsApi.LatLng(USA_COOR.lat, USA_COOR.lng),
      autoCompleteService: new mapsApi.places.AutocompleteService(),
      placesService: new mapsApi.places.PlacesService(map),
      geoCoderService: new mapsApi.Geocoder(),
      directionService: new mapsApi.DirectionsService(),
    });
  };

  // With the constraints, find some places to meet halfway
  handleSearch = () => {
    console.log("CURRENT SEARCH QUERY", this.state.currentSearchInput);
    console.log("CURRENT State ", this.state);
    const {
      markers,
      constraints,
      placesService,
      directionService,
      mapsApi,
    } = this.state;
    if (markers.length === 0) {
      message.warn("Add a constraint and try again!");
      return;
    }
    const filteredResults = [];
    const marker = markers[0];
    const timeLimit = constraints[0].time;
    const markerLatLng = new mapsApi.LatLng(marker.lat, marker.lng);

    const placesRequest = {
      location: markerLatLng,
      // radius: '30000', // Cannot be used with rankBy. Pick your poison!
      type: ["restaurant", "cafe"], // List of types: https://developers.google.com/places/supported_types
      query: this.state.currentSearchInput,
      rankBy: mapsApi.places.RankBy.DISTANCE, // Cannot be used with radius.
    };

    // First, search for pizza shops.
    placesService.textSearch(placesRequest, response => {
      // Only look at the nearest top 5.
      const responseLimit = Math.min(5, response.length);
      for (let i = 0; i < responseLimit; i++) {
        const meetingPlace = response[i];
        const { rating, name } = meetingPlace;
        const address = meetingPlace.formatted_address; // e.g 758 Peachtree Industrial Rd,
        const priceLevel = meetingPlace.price_level; // 1, 2, 3...
        let photoUrl = "";
        let openNow = false;
        if (meetingPlace.opening_hours) {
          openNow = meetingPlace.opening_hours.open_now; // e.g true/false
        }
        if (meetingPlace.photos && meetingPlace.photos.length > 0) {
          photoUrl = meetingPlace.photos[0].getUrl();
        }

        // Second, For each meetingPlace, check if it is within acceptable travelling distance
        const directionRequest = {
          origin: markerLatLng,
          destination: address, // Address of meeting place
          travelMode: "DRIVING",
        };
        directionService.route(directionRequest, (result, status) => {
          if (status !== "OK") {
            return;
          }
          const travellingRoute = result.routes[0].legs[0]; // { duration: { text: 1mins, value: 600 } }
          const travellingTimeInMinutes = travellingRoute.duration.value / 60;
          if (travellingTimeInMinutes < timeLimit) {
            const distanceText = travellingRoute.distance.text; // 6.4miles
            const timeText = travellingRoute.duration.text; // 11 mins
            filteredResults.push({
              name,
              rating,
              address,
              openNow,
              priceLevel,
              photoUrl,
              distanceText,
              timeText,
            });
          }
          // Finally, Add results to state
          this.setState({ searchResults: filteredResults });
        });
      }
    });
  };

  render() {
    const {
      constraints,
      mapsLoaded,
      americaLatLng,
      markers,
      searchResults,
    } = this.state;
    const { autoCompleteService, geoCoderService } = this.state; // Google Maps Services
    return (
      <div className="w-100 d-flex py-4 flex-wrap justify-content-center">
        <h1 className="w-100 fw-md">Search your next meeting place!</h1>
        {/* Constraints section */}
        <section className="col-4">
          {mapsLoaded ? (
            <div>
              {constraints.map((constraint, key) => {
                const { name, time } = constraint;
                return (
                  <div key={key} className="mb-4">
                    <div className="d-flex mb-2">
                      {/* <Input
                        className="col-4 mr-2"
                        placeholder="Name"
                        onChange={event =>
                          this.updateConstraintName(event, key)
                        }
                      /> */}
                      <Input
                        className="col-4 mr-2"
                        placeholder="Pizza"
                        onChange={event =>
                          this.updateConstraintName(event, key)
                        }
                      />
                      <MapAutoComplete
                        autoCompleteService={autoCompleteService}
                        geoCoderService={geoCoderService}
                        americaLatLng={americaLatLng}
                        markerName={name}
                        addMarker={this.addMarker}
                      />
                    </div>
                    <ConstraintSlider
                      iconType="car"
                      value={time}
                      onChange={value => this.updateConstraintTime(key, value)}
                      text="Minutes away by car"
                    />
                    <Divider />
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* Maps Section */}
        <section className="col-8 h-lg">
          <GoogleMapReact
            bootstrapURLKeys={{
              key: process.env.REACT_APP_GOOGLE_API_KEY,
              libraries: ["places", "directions"],
            }}
            defaultZoom={4}
            defaultCenter={{ lat: USA_COOR.lat, lng: USA_COOR.lng }}
            yesIWantToUseGoogleMapApiInternals={true}
            onGoogleApiLoaded={({ map, maps }) => this.apiHasLoaded(map, maps)} // "maps" is the mapApi. Bad naming but that's their library.
          >
            {/* Pin markers on the Map*/}
            {markers.map((marker, key) => {
              const { name, lat, lng } = marker;
              return <MapMarker key={key} name={name} lat={lat} lng={lng} />;
            })}
          </GoogleMapReact>
        </section>

        {/* Search Button */}
        <Button
          className="mt-4 fw-md"
          type="primary"
          size="large"
          onClick={this.handleSearch}
        >
          Search!
        </Button>

        {/* Results section */}
        {searchResults.length > 0 ? (
          <>
            <Divider />
            <section className="col-12">
              <div className="d-flex flex-column justify-content-center">
                <h1 className="mb-4 fw-md">Here are your meeting places!</h1>
                <div className="d-flex flex-wrap">
                  {searchResults.map((result, key) => (
                    <PlaceCard info={result} key={key} />
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    );
  }
}

export default MapsContainer;
