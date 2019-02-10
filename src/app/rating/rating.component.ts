import { Component, OnInit, Input } from '@angular/core';

interface IColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface IGradientPoint {
  t: number;
  color: IColor;
}

class Gradient {
  constructor(public points: IGradientPoint[]) { };

  sample(t: number): IColor {
    t = Math.max(0, Math.min(1, t));
    
    let lerp = (t: number, a: number, b: number) => { return (1 - t) * a + t * b };
    let pts = this.points;

    for (let i = 0; i < pts.length - 1; i++) {
      if (t >= pts[i].t && t <= pts[i + 1].t) {
        let k = (t - pts[i].t) / (pts[i + 1].t - pts[i].t);
        return {
          r: lerp(k, pts[i].color.r, pts[i + 1].color.r),
          g: lerp(k, pts[i].color.g, pts[i + 1].color.g),
          b: lerp(k, pts[i].color.b, pts[i + 1].color.b)
        }
      }
    }

    return pts[pts.length - 1].color;

  }

}

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit {

  @Input() rating: number = 0;
  @Input() maxRating: number = 5;

  ratingOn: boolean[] = [];
  cssColor: string;

  private gradient: Gradient = new Gradient([
    { t: 0, color: { r: 0, g: 255, b: 0 } },
    { t: 0.5, color: { r: 255, g: 255, b: 0 } },
    { t: 1, color: { r: 255, g: 0, b: 0 } },
  ]);

  constructor() {

  }

  ngOnInit() {

    let col = this.gradient.sample(this.rating / this.maxRating);
    this.cssColor = `rgb(${col.r},${col.g},${col.b})`;
    this.ratingOn = new Array<boolean>(this.maxRating);
    for (let i = 0; i < this.maxRating; i++) {
      this.ratingOn[i] = i < this.rating;
    }
  }

}
