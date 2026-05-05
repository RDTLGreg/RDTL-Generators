const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract, union } = require('@jscad/modeling').booleans;
const { translate, rotateX, rotateY, rotateZ, scale } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;

const getParameterDefinitions = () => {
  return [
    { name: 'thumb_width', type: 'float', initial: 0.85, caption: 'Thumb Width (in)', step: 0.01 },
    { name: 'thumb_depth', type: 'float', initial: 1.05, caption: 'Thumb Depth (in)', step: 0.01 },
    { name: 'oval_angle', type: 'float', initial: 45, caption: 'Oval Angle (deg)', step: 1 },
    { name: 'forward_pitch', type: 'float', initial: -0.25, caption: 'Fwd/Rev Pitch (in)', step: 0.0625 },
    { name: 'lateral_pitch', type: 'float', initial: 0.125, caption: 'Left/Right Pitch (in)', step: 0.0625 }
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

  // 1. THE SLUG (Solid)
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 64 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. THE CUTTER (The thing that gets removed)
  let hole = cylinder({ height: slug_height + 2, radius: 0.5, segments: 64 });
  
  // Create a bevel/fillet at the top
  let bevel = cylinder({ height: fillet_depth * 2, radiusStart: 0.5, radiusEnd: 0.75, segments: 64 });
  bevel = translate([0, 0, slug_height], bevel);

  let fullCutter = union(hole, bevel);
  
  // Transform the cutter
  fullCutter = scale([params.thumb_width, params.thumb_depth, 1], fullCutter);
  fullCutter = rotateZ(ovalRad, fullCutter);

  // Pivot from the TOP center
  fullCutter = translate([0, 0, -slug_height], fullCutter);
  fullCutter = rotateX(pitchX, fullCutter);
  fullCutter = rotateY(pitchY, fullCutter);
  fullCutter = translate([0, 0, slug_height], fullCutter);

  // 3. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. SUBTRACT (Blank minus Cutter and Notch)
  return subtract(blank, fullCutter, notch);
};

module.exports = { main, getParameterDefinitions };
