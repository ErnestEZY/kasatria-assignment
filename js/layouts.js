import * as THREE from "three";

const SPACING = 150; // px between tile centers in 3D space

/**
 * TABLE layout — flat 20 (cols) x 10 (rows) grid, per assignment spec.
 */
export function tableLayout(count, cols = 20, rows = 10) {
  const targets = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const object = new THREE.Object3D();
    object.position.x = (col - (cols - 1) / 2) * SPACING;
    object.position.y = -(row - (rows - 1) / 2) * SPACING;
    object.position.z = 0;
    targets.push(object);
  }
  return targets;
}

/**
 * SPHERE layout — even distribution via Fibonacci sphere algorithm.
 */
export function sphereLayout(count) {
  const targets = [];
  const radius = SPACING * (Math.sqrt(count) * 0.9);
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // 1 -> -1
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    const object = new THREE.Object3D();
    object.position.set(x * radius, y * radius, z * radius);

    const vector = new THREE.Vector3(x * 2, y * 2, z * 2);
    object.lookAt(vector);

    targets.push(object);
  }
  return targets;
}

/**
 * DOUBLE HELIX layout — two interleaved strands, offset by PI,
 * each winding around the vertical axis as it descends.
 */
export function helixLayout(count) {
  const targets = [];
  const strandGap = Math.PI; // 180° offset between the two strands
  const radius = SPACING * 3;
  const turns = 6; // how many full rotations top to bottom
  const totalHeight = count * (SPACING * 0.5);

  for (let i = 0; i < count; i++) {
    const strand = i % 2; // 0 or 1 -> which of the two strands
    const strandIndex = Math.floor(i / 2);
    const strandCount = Math.ceil(count / 2);

    const t = strandIndex / (strandCount - 1); // 0 -> 1 down the helix
    const theta = t * Math.PI * 2 * turns + strand * strandGap;

    const object = new THREE.Object3D();
    object.position.x = Math.cos(theta) * radius;
    object.position.y = totalHeight / 2 - t * totalHeight;
    object.position.z = Math.sin(theta) * radius;

    const vector = new THREE.Vector3(
      object.position.x * 2,
      object.position.y,
      object.position.z * 2
    );
    object.lookAt(vector);

    targets.push(object);
  }
  return targets;
}

/**
 * GRID layout — 3D block, 5 (x) by 4 (y) by 10 (z), per assignment spec.
 */
export function gridLayout(count, xCount = 5, yCount = 4, zCount = 10) {
  const targets = [];
  for (let i = 0; i < count; i++) {
    const x = i % xCount;
    const y = Math.floor(i / xCount) % yCount;
    const z = Math.floor(i / (xCount * yCount));

    const object = new THREE.Object3D();
    object.position.x = (x - (xCount - 1) / 2) * SPACING;
    object.position.y = (y - (yCount - 1) / 2) * SPACING;
    object.position.z = (z - (zCount - 1) / 2) * SPACING;
    targets.push(object);
  }
  return targets;
}
