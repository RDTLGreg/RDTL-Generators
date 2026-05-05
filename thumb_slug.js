/*
 * Rolling Down The Lane - Custom JoPo Thumb Slug Generator
 * Copyright (c) 2026 Rolling Down The Lane
 * * This file is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License (CC BY-NC-SA 4.0).
 * * You are free to use, copy, and modify this tool for personal or community use.
 * Commercial use, including selling the generated files or mass-producing 
 * physical prints for profit without explicit permission, is strictly prohibited.
 * * Full license text: https://creativecommons.org/licenses/by-nc-sa/4.0/
 * Website: https://RollingDownTheLane.com
 */

const { cylinder, cuboid } = require('@jscad/modeling').primitives;
const { subtract, union, intersection } = require('@jscad/modeling').booleans;
const { translate, rotateX, rotateY, rotateZ, scale } = require('@jscad/modeling').transforms;
const { degToRad } = require('@jscad/modeling').utils;

// --- 1. USER INTERFACE DEFINITIONS ---
// These sliders will automatically appear on your WordPress page.
const getParameterDefinitions = () => {
  return [
    { name: 'player_name', type: 'text', initial: 'Greg', caption: 'Player Name (for reference)' },
    { name: 'thumb_width', type: 'float', initial: 0.85, caption: 'Thumb Width (inches)', step: 0.01 },
    { name: 'thumb_depth', type: 'float', initial: 1.05, caption: 'Thumb Depth (inches)', step: 0.01 },
    { name: 'oval_angle', type: 'float', initial: 45, caption: 'Oval Angle (degrees)', step: 1 },
    { name: 'forward_pitch', type: 'float', initial: -0.25, caption: 'Forward/Reverse Pitch (inches)', step: 0.0625 },
    { name: 'lateral_pitch', type: 'float', initial: 0.125, caption: 'Left/Right Pitch (inches)', step: 0.0625 }
  ];
};

// --- 2. THE 3D ENGINE ---
const main = (params) => {
  // Constant Dimensions for JoPo Blank
  const slug_od = 1.265;
  const slug_height = 2.7;
  const ball_radius = 4.25;
  const fillet_depth = 0.15;

  // Convert Pro Shop Linear Pitch (inches) to CAD Rotational Math (radians)
  const pitchX = Math.asin(params.forward_pitch / ball_radius);
  const pitchY = Math.asin(params.lateral_pitch / ball_radius);
  const ovalRad = degToRad(params.oval_angle);

  // STEP A: THE MAIN SLUG BODY
  // Create the cylinder and shift it so the bottom is at Z=0
  let blank = cylinder({ height: slug_height, radius: slug_od / 2, segments: 128 });
  blank = translate([0, 0, slug_height / 2], blank);

  // STEP B: THE THUMB HOLE & FILLET GROUP
  // We group the hole and its bevel so they tilt together as one unit
  
  // 1. The Thumb Hole Cut
  let hole = cylinder({ height: slug_height + 1, radius: 0.5, segments: 64 });
  hole = scale([params.thumb_width, params.thumb_depth, 1], hole);
  hole = rotateZ(ovalRad, hole);
  
  // 2. The Top Lip Fillet (3D-Print Optimized Chamfer)
  let topFillet = cylinder({ 
      height: fillet_depth * 2, 
      radiusStart: 0.5, 
      radiusEnd: 0.7, 
      segments: 64 
  });
  topFillet = scale([params.thumb_width, params.thumb_depth, 1], topFillet);
  topFillet = rotateZ(ovalRad, topFillet);
  topFillet = translate([0, 0, slug_height - (fillet_depth / 2)], topFillet);

  // 3. Combine and Pivot from the Top Surface
  let combinedCutter = union(hole, topFillet);
  
  // Pivot Logic: Move to 0,0,0 -> Rotate -> Move back to Top
  combinedCutter = translate([0, 0, -slug_height], combinedCutter); 
  combinedCutter = rotateX(pitchX, combinedCutter);
  combinedCutter = rotateY(pitchY, combinedCutter);
  combinedCutter = translate([0, 0, slug_height], combinedCutter);

  // STEP C: THE ALIGNMENT NOTCH
  // Standard notch for JoPo alignment
  let notch = cuboid({ size: [0.12, 0.12, 0.4] });
  notch = translate([0, slug_od / 2, slug_height], notch);

  // STEP D: FINAL ASSEMBLY
  // Subtract all the cuts from the solid blank
  let finalSlug = subtract(blank, combinedCutter, notch);

  return finalSlug;
};

module.exports = { main, getParameterDefinitions };
