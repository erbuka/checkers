import { animate, state, style, transition, trigger } from '@angular/animations';

export const slideLeftAnimation = trigger("slideLeft",[
    transition(':enter', [
        style({ left : "10%", opacity : 0 }),
        animate("0.15s", style({ left : 0, opacity: 1 }))
    ]),
    transition(":leave", [
        style({ left : 0, opacity : 1}),
        animate("0.15s", style({ left : "10%", opacity: 0 }))
    ])
]);

export const slideRightAnimation = trigger("slideRight",[
    transition(':enter', [
        style({ right : "10%", opacity : 0 }),
        animate("0.15s", style({ right : 0, opacity: 1 }))
    ]),
    transition(":leave", [
        style({ right : 0, opacity : 1}),
        animate("0.15s", style({ right : "10%", opacity: 0 }))
    ])
]);

export const fadeAnimation = trigger("fade",[
    transition(':enter', [
        style({ opacity : 0 }),
        animate("0.15s", style({ opacity: 1 }))
    ]),
    transition(":leave", [
        style({ opacity : 1}),
        animate("0.15s", style({ opacity: 0 }))
    ])
]);