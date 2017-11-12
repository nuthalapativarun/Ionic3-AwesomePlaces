import { PlacesService } from './../../services/places';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Location } from './../../models/location';
import { SetLocationPage } from './../set-location/set-location';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { File, FileError, Entry } from '@ionic-native/file';

// import { Storage } from '@ionic/storage';

declare var cordova: any;

@Component({
  selector: 'page-add-place',
  templateUrl: 'add-place.html',
})
export class AddPlacePage {
  location: Location = {
    lat: 40.7624324,
    lng: -73.9759827
  };
  locationIsSet = false;
  imageUrl = '';

  constructor(private modalCtrl: ModalController,
    private geolocation: Geolocation,
    private locadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private camera: Camera,
    private placesService: PlacesService,
    private file: File) { }
  onSubmit(form: NgForm) {
    this.placesService.addPlace(form.value.title,
      form.value.description,
      this.location,
      this.imageUrl);
      form.reset();
      this.location = {
        lat: 40.7624324,
        lng: -73.9759827
      };
      this.imageUrl = '';
      this.locationIsSet = false;
  }

  onOpenMap() {
    const modal = this.modalCtrl.create(SetLocationPage,
      { location: this.location, isSet: this.locationIsSet });
    modal.present();
    modal.onDidDismiss(
      data => {
        if (data) {
          this.location = data.location;
          this.locationIsSet = true;
          console.log("ADD Place", this.location, '+', this.locationIsSet);
        }
      }
    );
  }

  onLocate() {
    const loader = this.locadingCtrl.create({
      content: 'Getting your Location...'
    });
    loader.present();
    this.geolocation.getCurrentPosition()
      .then(
      location => {
        loader.dismiss();
        console.log("Got Location", location);
        this.location.lat = location.coords.latitude;
        this.location.lng = location.coords.longitude;
        this.locationIsSet = true;
      }
      )
      .catch(
      error => {
        loader.dismiss();
        const toast = this.toastCtrl.create({
          message: 'Could not get your location',
          duration: 2500
        });
        toast.present();
        console.log("Location Error", JSON.stringify(error));
      }
      );
  }

  onTakePhoto() {
    const options: CameraOptions = {
      quality: 100,
      correctOrientation: true,
      allowEdit: true,
      // destinationType: this.camera.DestinationType.DATA_URL,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.CAMERA
    }
    this.camera.getPicture(options).then(
      (imageData) => {
        const currentName = imageData.replace(/^.*[\\\/]/,'');
        const path = imageData.replace(/[^\/]*$/,'');
        const newFileName = new Date().getUTCMilliseconds() + '.jpg';
        console.log("Name, path", currentName,"+", path);
        this.file.moveFile(path, currentName, cordova.file.dataDirectory, newFileName)
        .then(
          (data: Entry) => {
            this.imageUrl = data.nativeURL;
            this.camera.cleanup();
            // this.file.removeFile(path, currentName);
          }
        )
        .catch(
          (err: FileError) => {
            this.imageUrl = '';
            const toast = this.toastCtrl.create({
              message: 'Could not save the image. Please try again',
              duration: 2500
            });
            toast.present();
            this.camera.cleanup();
          }
        );
        const base64Image = 'data:image/jpeg;base64,' + imageData;
        this.imageUrl = base64Image;
      }, (error) => {
        const toast = this.toastCtrl.create({
          message: 'Could not take the image. Please try again',
          duration: 2500
        });
        toast.present();
      });
  }
}
