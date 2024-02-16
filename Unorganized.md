# Unorganized Thoughts

- Correctness over performance
- Don't worry about types right now

## Higher-Order Functions as Collections

Can we treat returned higher-order functions as collections?

```javascript
// mapFn : b -> c
// fn : a -> b
// mapFn(mapFn, fn) : a -> c
function fnMap(mapFn, fn) {
  return x => mapFn(fn(x));
}

// type Result = number | HyperDual | Functor<Result>;
//
// OR
//
// type Result = HyperDual | Functor<Result>;
function extract(tag, res) {}

function D(f) {
  // General principle: strip off as many tags as we add.
}
```

## Generic Arithmetic

```javascript
function lift2(op, opName) {
  return (x, y) => {
    if (typeof x === 'number' && typeof y === 'number') {
      return op(x, y);
    } else if (x && typeof x === 'object' && 'type' in x) {
      if (!(opName in x)) {
        throw new Error('');
      }

      if (typeof y === 'number') {
        const y1 = x.prototype.from('number', y);
        if (y1) {
        }
      } else if (y && typeof y === 'object' && 'type' in y) {
        if (x.type === y.type) {
        } else {
        }
      } else {
        throw new Error('');
      }
    } else if (y && typeof y === 'object' && 'type' in y) {
      if (!(opName in y)) {
        throw new Error('');
      }

      if (typeof x === 'number') {
      } else if (x && typeof x === 'object' && 'type' in x) {
      } else {
        throw new Error('');
      }
    } else {
      throw new Error('');
    }
  };
}
```

```javascript
/*

interface HyperDual {
  prim: number | HyperDual;
  tan: number | HyperDual;
  tag: number;
}

vs.

type HyperDual
  = number
  | { prim: HyperDual; tan: HyperDual; tag: number };

??

 */

class HyperDual {
  // Can tag be absent?
  // E.g. if we promote a number to a Dual?
  constructor(prim, tan, tag) {}

  from(type, v) {
    switch (type) {
      case 'number':
        return new HyperDual(v, 0 /* ?? */);
      case 'expr':
        return new HyperDual(v, 0 /* ?? */);
      default:
        return null;
    }
  }

  // plus : HyperDual ~> HyperDual -> HyperDual
  plus(x) {}

  // times : HyperDual ~> HyperDual -> HyperDual
  times(y) {}
}

// Maybe this is better?
class HyperDual {
  static simple(value) {
    const d = new HyperDual();
    d.value = value;
    d.kind = 'SIMPLE';
    return d;
  }

  static compound(prim, tan, tag) {
    // ...
  }

  plus(y) {}

  times(y) {}
}
```
