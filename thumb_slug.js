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
  const fillet_depth = 0.2; // Increased slightly for visibility

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // 2. THE HOLE (Extra long to prevent angled top artifacts)
  let hole = cylinder({ height: 6, radius: 0.5, segments: 64 });
  // Position so the center of the pivot is at the top of the hole section
  hole = translate([0, 0, -3], hole); 

  // 3. THE BEVEL (A cone that sits at the top)
  let bevel = cylinder({ height: 0.6, radiusStart: 0.5, radiusEnd: 0.8, segments: 64 });
  bevel = translate([0, 0, -0.2], bevel); // Sunk in so it creates a nice flare

  // Combine and Transform
  let cutters = union(hole, bevel);
  cutters = scale([params.thumb_width, params.thumb_depth, 1], cutters);
  cutters = rotateZ(ovalRad, cutters);
  
  // Pivot for Pitch
  cutters = rotateX(pitchX, cutters);
  cutters = rotateY(pitchY, cutters);
  
  // Move to the top of the slug
  // We lift it exactly to slug_height. Because the cutters are so tall, 
  // they will "punch through" the top perfectly flat.
  cutters = translate([0, 0, slug_height], cutters);

  // 4. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  return subtract(blank, cutters, notch);
};

module.exports = { main, getParameterDefinitions };
