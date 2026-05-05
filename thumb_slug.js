const { cylinder, cuboid, ellipse } = require('@jscad/modeling').primitives;
const { subtract, union } = require('@jscad/modeling').booleans;
const { translate, rotateZ, extrudeLinear } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;

const getParameterDefinitions = () => {
  return [
    { name: 'thumb_width', type: 'float', initial: 0.85, caption: 'Thumb Width (in)', step: 0.01, min: 0.5, max: 1.15 },
    { name: 'thumb_depth', type: 'float', initial: 1.05, caption: 'Thumb Depth (in)', step: 0.01, min: 0.5, max: 1.15 },
    { name: 'oval_angle', type: 'float', initial: 45, caption: 'Oval Angle (deg)', step: 1, min: 0, max: 360 }
  ];
};

const main = (params) => {
  const slug_od = 1.265;
  const slug_height = 2.7;
  const bevel_depth = 0.15;
  const ovalRad = degToRad(params.oval_angle);

  // 1. THE SLUG
  let slug = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  slug = translate([0, 0, slug_height / 2], slug);

  // 2. THE VERTICAL OVAL HOLE
  let thumb2D = ellipse({ radius: [params.thumb_width / 2, params.thumb_depth / 2], segments: 64 });
  thumb2D = rotateZ(ovalRad, thumb2D);
  let hole = extrudeLinear({ height: slug_height + 1 }, thumb2D);
  hole = translate([0, 0, (slug_height + 1) / 2], hole);

  // 3. THE BEVEL (Flat Top)
  let bevel = cylinder({ height: bevel_depth * 2, radiusStart: 0.5, radiusEnd: 0.75, segments: 64 });
  bevel = translate([0, 0, slug_height], bevel);

  // 4. THE NOTCH
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // 5. THE FINAL SUBTRACTION
  return subtract(slug, hole, bevel, notch);
};

module.exports = { main, getParameterDefinitions };
