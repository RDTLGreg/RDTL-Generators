const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract, union, intersect } = require('@jscad/modeling').booleans;
const { translate, rotateX, rotateY, rotateZ, scale } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;

const getParameterDefinitions = () => {
  return [
    { name: 'thumb_width', type: 'float', initial: 0.85, caption: 'Thumb Width (in)', step: 0.01, min: 0.5, max: 1.2 },
    { name: 'thumb_depth', type: 'float', initial: 1.05, caption: 'Thumb Depth (in)', step: 0.01, min: 0.5, max: 1.2 },
    { name: 'oval_angle', type: 'float', initial: 45, caption: 'Oval Angle (deg)', step: 1, min: 0, max: 360 },
    { name: 'forward_pitch', type: 'float', initial: -0.25, caption: 'Fwd/Rev Pitch (in)', step: 0.0625, min: -1, max: 1 },
    { name: 'lateral_pitch', type: 'float', initial: 0.125, caption: 'Left/Right Pitch (in)', step: 0.0625, min: -1, max: 1 }
  ];
};

const main = (params) => {
  const slug_od = 1.265;
  const slug_height = 2.7;
  const ball_radius = 4.25;
  const bevel_depth = 0.2;

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG (The 'Target')
  let slug = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  slug = translate([0, 0, slug_height / 2], slug);

  // 2. THE CUTTER (The 'Drill')
  // We make it massive (10 inches) so only the sidewalls touch the slug
  let hole = cylinder({ height: 10, radius: 0.5, segments: 64 });
  
  // The Bevel - Sunk 0.1 into the hole for a smooth transition
  let bevel = cylinder({ height: 1.0, radiusStart: 0.5, radiusEnd: 0.85, segments: 64 });
  bevel = translate([0, 0, 0.4], bevel); 

  let cutter = union(hole, bevel);
  cutter = scale([params.thumb_width, params.thumb_depth, 1], cutter);
  cutter = rotateZ(ovalRad, cutter);
  
  // Pivot from the center of the top (Z=0 in the cutter's local space)
  cutter = rotateX(pitchX, cutter);
  cutter = rotateY(pitchY, cutter);
  
  // Place the pivot point at the top of the slug
  cutter = translate([0, 0, slug_height], cutter);

  // 3. THE NOTCH (Raised up slightly so it is cut AFTER the top is flattened)
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. THE MASTER FLATTENER
  // A solid block that represents 'valid space' - anything outside is deleted
  let worldBox = cuboid({ size: [5, 5, slug_height] });
  worldBox = translate([0, 0, slug_height / 2], worldBox);

  // 5. EXECUTION
  // First, cut the hole out of the slug
  let finalModel = subtract(slug, cutter);
  
  // Second, force the top to be flat by intersecting it with the worldBox
  finalModel = intersect(finalModel, worldBox);
  
  // Finally, cut the notch (Doing it last ensures it doesn't get flattened/deleted)
  finalModel = subtract(finalModel, notch);

  return finalModel;
};

module.exports = { main, getParameterDefinitions };
