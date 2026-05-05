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
  const bevel_depth = 0.15;

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG (Vertical and Stationary)
  let slug = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  slug = translate([0, 0, slug_height / 2], slug);

  // 2. THE CUTTER (Built so the top center is [0,0,0])
  // We make the hole 5 inches long so it clears the bottom
  let hole = cylinder({ height: 5, radius: 0.5, segments: 64 });
  hole = translate([0, 0, -2.5], hole); // Shift so top is at Z=0

  // The Bevel (anchored to the top of the hole)
  let bevel = cylinder({ height: 0.4, radiusStart: 0.5, radiusEnd: 0.75, segments: 64 });
  bevel = translate([0, 0, -0.1], bevel); // Sink into the top slightly

  let cutter = union(hole, bevel);
  
  // Scale and Rotate the cutter at the origin (0,0,0)
  cutter = scale([params.thumb_width, params.thumb_depth, 1], cutter);
  cutter = rotateZ(ovalRad, cutter);
  
  // PITCH ROTATION (Happens exactly at the top center 0,0,0)
  cutter = rotateX(pitchX, cutter);
  cutter = rotateY(pitchY, cutter);
  
  // MOVE CUTTER TO SLUG TOP
  cutter = translate([0, 0, slug_height], cutter);

  // 3. THE NOTCH (Standard JoPo alignment slot)
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height - 0.1], notch);

  // 4. FINAL SUBTRACTION
  // We take the slug and subtract the tilted cutter and the notch slot
  return subtract(slug, cutter, notch);
};

module.exports = { main, getParameterDefinitions };
