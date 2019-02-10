import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import {GameComponent} from './game/game.component';
import { RatingComponent } from './rating/rating.component';

@NgModule({
  imports:      [ BrowserModule, BrowserAnimationsModule ],
  declarations: [ AppComponent, GameComponent, RatingComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
