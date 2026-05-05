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
  const bevel_depth = 0.2;

  // Pitch Angles
  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG (Solid Blank)
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. THE CUTTER ASSEMBLY (Building the 'drill bit' from Z=0 downwards)
  
  // The Main Hole (Diameter 1 so scaling works perfectly)
  let hole = cylinder({ height: 4, radius: 0.5, segments: 64 });
  hole = translate([0, 0, -2], hole); // Moves top of cylinder to 0

  // The Bevel (A flare at the top)
  let bevel = cylinder({ height: bevel_depth * 2, radiusStart: 0.5, radiusEnd: 0.75, segments: 64 });
  bevel = translate([0, 0, -bevel_depth + 0.05], bevel); // Overlap slightly with hole

  // Group and Transform the 'drill bit'
  let cutters = union(hole, bevel);
  cutters = scale([params.thumb_width, params.thumb_depth, 1], cutters);
  cutters = rotateZ(ovalRad, cutters);
  
  // APPLY PITCH (Pivot point is now naturally [0,0,0] - the center of the top entry)
  cutters = rotateX(pitchX, cutters);
  cutters = rotateY(pitchY, cutters);
  
  // PLACE AT TOP OF SLUG
  cutters = translate([0, 0, slug_height], cutters);

  // 3. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 4. FINAL CUT
  return subtract(blank, cutters, notch);
};

module.exports = { main, getParameterDefinitions };
