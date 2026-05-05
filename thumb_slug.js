const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract, union } = require('@jscad/modeling').booleans;
const { translate, rotateX, rotateY, rotateZ, scale } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;

const getParameterDefinitions = () => {
  return [
    { name: 'player_name', type: 'text', initial: 'Greg', caption: 'Player Name' },
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

  // 1. Create the Solid Blank
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. Build the Cutter (Hole + Bevel)
  let hole = cylinder({ height: slug_height + 1, radius: 0.5, segments: 64 });
  
  // Create a bevel at the top
  let bevel = cylinder({ height: fillet_depth * 2, radiusStart: 0.5, radiusEnd: 0.7, segments: 64 });
  bevel = translate([0, 0, (slug_height / 2) + (fillet_depth)], bevel);
  
  let combinedCutter = union(hole, bevel);
  
  // Apply Oval Scaling and Rotation
  combinedCutter = scale([params.thumb_width, params.thumb_depth, 1], combinedCutter);
  combinedCutter = rotateZ(ovalRad, combinedCutter);

  // Apply Pitch Pivot (from the top center)
  combinedCutter = translate([0, 0, -slug_height / 2], combinedCutter);
  combinedCutter = rotateX(pitchX, combinedCutter);
  combinedCutter = rotateY(pitchY, combinedCutter);
  combinedCutter = translate([0, 0, slug_height / 2], combinedCutter);

  // 3. The Alignment Notch
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. PERFORM THE SUBTRACTION
  // This ensures we return the blank MINUS the cutters
  return subtract(blank, combinedCutter, notch);
};

module.exports = { main, getParameterDefinitions };
