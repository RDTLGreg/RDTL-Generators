const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract } = require('@jscad/modeling').booleans;
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

  // 1. THE SOLID BLANK
  let result = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  result = translate([0, 0, slug_height / 2], result);

  // 2. THE ALIGNMENT NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);
  result = subtract(result, notch);

  // 3. THE HOLE CUTTER (Longer than slug, anchored at top)
  let hole = cylinder({ height: slug_height + 2, radius: 0.5, segments: 64 });
  hole = translate([0, 0, -(slug_height + 2) / 2], hole); // Anchor top at 0
  hole = scale([params.thumb_width, params.thumb_depth, 1], hole);
  hole = rotateZ(ovalRad, hole);
  hole = rotateX(pitchX, hole);
  hole = rotateY(pitchY, hole);
  hole = translate([0, 0, slug_height + 0.1], hole); // Lift into slug + overshoot top

  result = subtract(result, hole);

  // 4. THE BEVEL CUTTER (Small cone at top)
  let bevel = cylinder({ height: 0.4, radiusStart: 0.5, radiusEnd: 0.8, segments: 64 });
  bevel = translate([0, 0, -0.2], bevel); // Anchor top near 0
  bevel = scale([params.thumb_width, params.thumb_depth, 1], bevel);
  bevel = rotateZ(ovalRad, bevel);
  bevel = rotateX(pitchX, bevel);
  bevel = rotateY(pitchY, bevel);
  bevel = translate([0, 0, slug_height + 0.1], bevel); // Lift into slug + overshoot top

  result = subtract(result, bevel);

  return result;
};

module.exports = { main, getParameterDefinitions };
