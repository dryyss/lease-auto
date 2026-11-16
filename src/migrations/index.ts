import * as migration_20261106_065051_initial from './20261106_065051_initial';
import * as migration_20261116_190000_reviews_social from './20261116_190000_reviews_social';
import * as migration_20261116_220000_requests_refusal from './20261116_220000_requests_refusal';
import * as migration_20261116_230000_vehicles_plate from './20261116_230000_vehicles_plate';

export const migrations = [
  {
    up: migration_20261106_065051_initial.up,
    down: migration_20261106_065051_initial.down,
    name: '20261106_065051_initial'
  },
  {
    up: migration_20261116_190000_reviews_social.up,
    down: migration_20261116_190000_reviews_social.down,
    name: '20261116_190000_reviews_social'
  },
  {
    up: migration_20261116_220000_requests_refusal.up,
    down: migration_20261116_220000_requests_refusal.down,
    name: '20261116_220000_requests_refusal'
  },
  {
    up: migration_20261116_230000_vehicles_plate.up,
    down: migration_20261116_230000_vehicles_plate.down,
    name: '20261116_230000_vehicles_plate'
  },
];
