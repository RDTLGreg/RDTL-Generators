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

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG
  let slug = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  slug = translate([0, 0, slug_height / 2], slug);

  // 2. THE CUTTER (Extra-long cylinder so the 'slanted top' is 2 inches above the slug)
  let hole = cylinder({ height: 8, radius: 0.5, segments: 64 });
  
  // The Bevel - we make this a very tall cone so the tilt doesn't leave a lip
  let bevel = cylinder({ height: 1.0, radiusStart: 0.5, radiusEnd: 0.9, segments: 64 });
  bevel = translate([0, 0, 0.4], bevel); // Lift it so the transition is at Z=0

  let cutter = union(hole, bevel);
  cutter = scale([params.thumb_width, params.thumb_depth, 1], cutter);
  cutter = rotateZ(ovalRad, cutter);
  
  // Pivot from Z=0 (the entry point)
  cutter = rotateX(pitchX, cutter);
  cutter = rotateY(pitchY, cutter);
  
  // Move it so the pivot point sits exactly at the slug's top surface
  cutter = translate([0, 0, slug_height], cutter);

  // 3. THE FLATTENER (A massive block to shave the top 100% flat)
  let flattener = cuboid({ size: [10, 10, 4] });
  flattener = translate([0, 0, slug_height + 2.0], flattener);

  // 4. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 5. FINAL ASSEMBLY
  let finalModel = subtract(slug, cutter, notch, flattener);

  return finalModel;
};

module.exports = { main, getParameterDefinitions };
