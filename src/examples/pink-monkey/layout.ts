import { treadPoint, type Staircase2D } from '../../core/contacts';

export const groundY = 650;
export const floorHorizon = 560;
export const approachX = 510;
export const stairs: Staircase2D = { origin: [590, 620], run: 140, rise: 60 };
export const boardingFeet = [treadPoint(stairs, 0, 34 / 140), treadPoint(stairs, 0, 66 / 140)];
export const rideStarts = 6.4;
