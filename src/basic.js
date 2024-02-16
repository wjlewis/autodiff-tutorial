function plus([a, b], [c, d]) {
  return [a + c, b + d];
}

function times([a, b], [c, d]) {
  return [a * c, b * c + a * d];
}

function minus(lhs, rhs) {
  return plus(lhs, neg(rhs));
}

// Negate a dual number.
function neg([a, b]) {
  return [-a, -b];
}

// Raise a dual number to the nth power.
function pow([a, b], n) {
  return [a ** n, n * a ** (n - 1) * b];
}

// Promote a JS number to a dual number.
function promote(a) {
  return [a, 0];
}

// f(x) = 3x^2 + 2x - 1
//
// x is a _dual number_, not a JS number.
function f(x) {
  return minus(
    plus(times(promote(3), pow(x, 2)), times(promote(2), x)),
    promote(1)
  );
}

console.log('Computing f and its derivative at 2:');
console.log(f([2, 1]));

// Invert a dual number.
function inv([a, b]) {
  return [1 / a, -b / a ** 2];
}

function div(lhs, rhs) {
  return times(lhs, inv(rhs));
}

// Lift a function from number -> number to operate on dual numbers.
function lift(f, Df) {
  return ([a, b]) => {
    return [f(a), b * Df(a)];
  };
}

const sin = lift(Math.sin, Math.cos);
const cos = lift(Math.cos, x => -Math.sin(x));
const exp = lift(Math.exp, Math.exp);

// g(x) = xe^{2x} + x^2
function g(x) {
  return plus(times(x, exp(times(promote(2), x))), pow(x, 2));
}

console.log('Computing g and its derivative at -1:');
console.log(g([-1, 1]));

// Return a function that computes the derivative of f.
// f must expect and return a _dual number_.
function D(f) {
  return a => {
    const y = f([a, 1]);
    return y[1];
  };
}

const Df = D(f);

console.log('Computing Df(2):');
console.log(Df(2));

// "Lower" a function that operates on dual numbers to use JS numbers instead.
function lower(f) {
  return x => {
    const y = f([x, 1]);
    return y[0];
  };
}

console.log('Computing f(2) using `lower`:');
console.log(lower(f)(2));
