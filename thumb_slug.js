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

  // Pitch Angles
  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG BLANK (Centered at Z=0 for easier math)
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. THE CUTTER ASSEMBLY
  // Create a hole that starts at Z=0 and goes DOWN
  let hole = cylinder({ height: slug_height + 1, radius: 0.5, segments: 64 });
  hole = translate([0, 0, -(slug_height + 1) / 2], hole);
  
  // Create the bevel at the very top (Z=0)
  let bevel = cylinder({ height: fillet_depth * 2, radiusStart: 0.5, radiusEnd: 0.7, segments: 64 });
  bevel = translate([0, 0, -fillet_depth], bevel);

  // Combine them into one "drill bit"
  let fullCutter = union(hole, bevel);
  
  // Apply Oval Scaling and Rotation
  fullCutter = scale([params.thumb_width, params.thumb_depth, 1], fullCutter);
  fullCutter = rotateZ(ovalRad, fullCutter);

  // PITCH PIVOT: Rotate the cutter from its top center (0,0,0)
  fullCutter = rotateX(pitchX, fullCutter);
  fullCutter = rotateY(pitchY, fullCutter);

  // MOVE TO FINAL POSITION: Lift the cutter so its top is at the top of the slug
  fullCutter = translate([0, 0, slug_height], fullCutter);

  // 3. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. THE SUBTRACTION
  return subtract(blank, fullCutter, notch);
};

module.exports = { main, getParameterDefinitions };
