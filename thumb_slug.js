const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract, union } = require('@jscad/modeling').booleans;
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
  const fillet_depth = 0.15;

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG BLANK
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. THE CUTTER ASSEMBLY
  // We make the hole 4 inches long to ensure it clears top and bottom easily
  let hole = cylinder({ height: 4.0, radius: 0.5, segments: 64 });
  hole = translate([0, 0, -2.0], hole); // Center it so the 'top' is at 0
  
  // The Bevel - Sunk into the hole slightly for a solid union
  let bevel = cylinder({ height: 0.5, radiusStart: 0.5, radiusEnd: 0.8, segments: 64 });
  bevel = translate([0, 0, -0.25], bevel); 

  let fullCutter = union(hole, bevel);
  
  // Scale for Oval and Rotate for Angle
  fullCutter = scale([params.thumb_width, params.thumb_depth, 1], fullCutter);
  fullCutter = rotateZ(ovalRad, fullCutter);

  // Apply Pitch Rotation (Pivots from the exact center of the top entry)
  fullCutter = rotateX(pitchX, fullCutter);
  fullCutter = rotateY(pitchY, fullCutter);

  // MOVE TO FINAL POSITION
  // We lift it to slug_height PLUS a tiny bit (0.05) to ensure it clears the top
  fullCutter = translate([0, 0, slug_height + 0.05], fullCutter);

  // 3. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. THE FINAL SUBTRACTION
  return subtract(blank, fullCutter, notch);
};

module.exports = { main, getParameterDefinitions };
