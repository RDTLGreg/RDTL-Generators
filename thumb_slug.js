const { cylinder, cuboid, ellipse } = require('@jscad/modeling').primitives;
const { subtract, union, intersect } = require('@jscad/modeling').booleans;
const { translate, rotateX, rotateY, rotateZ, project, extrudeLinear } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;
const { extrudeFromSlices, slice } = require('@jscad/modeling').extrusions;

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

  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG
  let slug = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  slug = translate([0, 0, slug_height / 2], slug);

  // 2. THE HOLE (Extrusion Method)
  // Create a 2D shape first
  let thumb2D = ellipse({ radius: [params.thumb_width / 2, params.thumb_depth / 2], segments: 64 });
  thumb2D = rotateZ(ovalRad, thumb2D);

  // Extrude it into a 3D solid that is much longer than the slug
  let hole = extrudeLinear({ height: 5 }, thumb2D);
  hole = translate([0, 0, -2.5], hole); // Center it so Z=0 is the pivot point

  // 3. THE BEVEL (A separate cut to ensure it doesn't tilt the top)
  let bevel = cylinder({ height: 0.4, radiusStart: 0.5, radiusEnd: 0.8, segments: 64 });
  bevel = translate([0, 0, -0.2], bevel);
  bevel = rotateZ(ovalRad, bevel);

  let cutter = union(hole, bevel);
  
  // Rotate for Pitch
  cutter = rotateX(pitchX, cutter);
  cutter = rotateY(pitchY, cutter);
  
  // Place at the top
  cutter = translate([0, 0, slug_height], cutter);

  // 4. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 5. THE ULTIMATE LEVELER
  // Instead of a box, we use a 'Intersection Plane'
  let leveler = cylinder({ height: slug_height, radius: slug_od, segments: 128 });
  leveler = translate([0, 0, slug_height / 2], leveler);

  // EXECUTION
  let result = subtract(slug, cutter, notch);
  result = intersect(result, leveler);

  return result;
};

module.exports = { main, getParameterDefinitions };
