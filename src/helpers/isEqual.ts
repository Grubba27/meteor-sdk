export const isEqual = <T1 extends any[] | {}, T2 extends any[] | {}>(value: T1, other: T2) => {

  // Get the value type
  const type = Object.prototype.toString.call(value);

  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other)) return false;

  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

  // Compare the length of the length of the two items
  const valueLen = Array.isArray(value) ? value.length : Object.keys(value).length;
  const otherLen = Array.isArray(other) ? other.length : Object.keys(other).length;
  if (valueLen !== otherLen) return false;

  // Compare two items
  const compare = <P1 extends any[] | {}, P2 extends any[] | {}>(item1: P1, item2: P2) => {

    // Get the object type
    const itemType = Object.prototype.toString.call(item1);

    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2)) return false;
    }

    // Otherwise, do a simple comparison
    else {

      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) return false;

      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) return false;
      } else {
        // @ts-ignore
        if (item1 !== item2) return false;
      }

    }

  };

  // Compare properties
  if (Array.isArray(value) && Array.isArray(other)) {
    for (let i = 0; i < valueLen; i++) {
      if (!compare(value[i], other[i])) return false;
    }
  } else {
    for (const key in value) {
      if (value.hasOwnProperty(key) && other.hasOwnProperty(key)) {
        const k = key as unknown as Extract<keyof T2, string>
        // @ts-ignore
        if (!compare(value[key], other[k])) return false;
      }
    }
  }

  // If nothing failed, return true
  return true;
};
