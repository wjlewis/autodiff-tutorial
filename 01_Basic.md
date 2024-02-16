# 01 Basic

_In which we develop a simple but limited system for performing automatic
differentiation using the dual numbers._

Consider the function $f(x) = 3x^2 + 2x - 1$.
There's a beguiling trick that allows us to calculate the derivative of $f$ at
the same time we evaluate it.
The idea is to apply $f$ not to a real number but to an element of a special
ring: the ring of [_dual numbers_](https://en.wikipedia.org/wiki/Dual_number).

We can represent a dual number as a pair whose elements are numbers from some
ring (like $\mathbb{R}$).
To add two dual numbers we sum their components:

$$
(a, b) + (c, d) = (a + c, b + d)
$$

Multiplication is a little funkier:

$$
(a, b) \cdot (c, d) = (ac, bc + ad)
$$

Back to the initial promise: we can compute $f$'s value _and_ derivative by
applying it to an appropriate dual number:

$$
f((a, 1)) = 3(a, 1)^2 + 2(a, 1) - 1
$$

We haven't yet said how to subtract two dual numbers, or multiply a "regular"
number by a dual number (like $2(a, 1)$).
Subtraction is just a "macro":

$$
(a, b) - (c, d) \equiv (a, b) + (-c, -d)
$$

and a "regular" number like $2$ is just shorthand for the dual number $(2, 0)$.
With these ideas in hand we find that:

$$
\begin{align*}
f((a, 1)) &= (3, 0)(a, 1)^2 + (2, 0)(a, 1) + (-1, 0) \\
          &= (3, 0)(a^2, 2a) + (2a, 2) + (-1, 0) \\
          &= (3a^2, 6a) + (2a, 2) + (-1, 0) \\
          &= (3a^2 + 2a - 1, 6a + 2)
\end{align*}
$$

The value of $f$ at $a$ is sitting in the first index of the resulting pair, and
its derivative at $a$ is in the second:

$$
\begin{align*}
f(a) &= \pi_0 f((a, 1)) \\
Df(a) &= \pi_1 f((a, 1))
\end{align*}
$$

We'll consider _why_ this works in a later note; for now let's focus on an
implemention.

## Implementation in JavaScript

We'll represent pairs as 2-element arrays.
Defining addition and multiplication is a simple exercise in transliteration:

```javascript
function plus([a, b], [c, d]) {
  return [a + c, b + d];
}

function times([a, b], [c, d]) {
  return [a * c, b * c + a * d];
}
```

A few additional operation definitions will vastly improve our quality of life:

```javascript
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
```

We can now define $f$ in JavaScript:

```javascript
// f(x) = 3x^2 + 2x - 1
//
// x is a _dual number_, not a JS number.
function f(x) {
  return minus(
    plus(times(promote(3), pow(x, 2)), times(promote(2), x)),
    promote(1)
  );
}
```

As we saw above, evaluating $f$ at the pair `[a, 1]` produces a pair containing
$f(a)$ and $Df(a)$.
For instance:

```javascript
console.log(f([2, 1]));
// => [15, 14]
```

Which is exactly what we expect to see!

## Additional Functions

What about functions like $\sin$ and $\cos$, or even division?
We _can_ divide two dual numbers, as long as the first element in the
denominator is nonzero (which is a natural condition considering how we're using
them).
It's easier to first define "inversion", after which division is just another
"macroexpansion":

$$
(a, b)^{-1} = \left(\frac{1}{a}, -\frac{b}{a^2}\right)
$$

So:

$$
\begin{align*}
\frac{(a, b)}{(c, d)}
  &= (a, b) \cdot \left(\frac{1}{c}, -\frac{d}{c^2}\right) \\
  &= \left(\frac{a}{c}, \frac{bc - ad}{c^2}\right)
\end{align*}
$$

These are a cinch to translate to JavaScript:

```javascript
// Invert a dual number.
function inv([a, b]) {
  return [1 / a, -b / a ** 2];
}

function div(lhs, rhs) {
  return times(lhs, inv(rhs));
}
```

For $\sin$, $\cos$, and others, we need a slightly different approach, but the
same basic idea holds: we need to "lift" these functions to expect a pair and
return a pair; and the pair they return should contain the _value_ in the first
slot, and the _derivative_ in the second.

This is _nearly_ true.
The second slot doesn't contain just the derivative, but a scaled version of it.
To see why, consider the fact that $\sin$ is
[_analytic_](https://en.wikipedia.org/wiki/Analytic_function), and so:

$$
\sin(x) = \sin(a) + \cos(a)(x - a) - \frac{\sin(a)}{2}(x - a)^2 - \cdots
$$

i.e. it's [_Taylor expansion_](https://en.wikipedia.org/wiki/Analytic_function)
at some point $a$.
Evaluating this series at the _dual number_ $(a, b)$, we find:

$$
\begin{align*}
\sin((a, b))
  &= \sin(a) + \cos(a)((a, b) - a) - \frac{\sin(a)}{2}((a, b) - a)^2 - \cdots \\
  &= \sin(a) + (0, b\cos(a)) - 0 - \cdots \\
  &= (\sin(a), b\cos(a))
\end{align*}
$$

The second and all higher powers of $(x - a)$ are zero when evaluated at the
dual number $(a, b)$.
This is because $((a,b) - (a, 0)) = (0, b)$, and:

$$
(0, b)^2 = (0, 0b + b0) = (0, 0)
$$

So:

```javascript
function sin([a, b]) {
  return [Math.sin(a), b * Math.cos(a)];
}
```

But this same trick works for _any_ function within a region where it's
analytic.
We simply express it as its taylor series and evaluate it at a dual number.
In general:

$$
f((a, b)) = (f(a), b \cdot Df(a))
$$

This allows us to define `lift`, which "lifts" a function from `number -> number` to one that operates on dual numbers instead:

```javascript
// Lift a function from number -> number to operate on dual numbers.
function lift(f, Df) {
  return ([a, b]) => {
    return [f(a), b * Df(a)];
  };
}
```

With `lift` in hand, we could have defined `sin` like so:

```javascript
const sin = lift(Math.sin, Math.cos);
```

Similarly with `cos`, `exp`, and more:

```javascript
const cos = lift(Math.cos, x => -Math.sin(x));
const exp = lift(Math.exp, Math.exp);
```

Let's try one more example:

$$
g(x) = xe^{2x} + x^2
$$

```javascript
// g(x) = xe^{2x} + x^2
function g(x) {
  return plus(times(x, exp(times(promote(2), x))), pow(x, 2));
}
```

Then:

```javascript
console.log(g([-1, 1]));
// => [ 0.8646647167633873, -2.135335283236613 ]
```

Which matches what we find by computing the derivative by hand.

## A Derivative Operator

Given a function `f` that expects and returns a dual number, we can define the
derivative _operator_ as a JavaScript function:

```javascript
// Return a function that computes the derivative of f.
// f must expect and return a _dual number_.
function D(f) {
  return a => {
    const y = f([a, 1]);
    return y[1];
  };
}
```

which just does what we've been doing by hand: it evaluates `f` at the dual
number `[a, 1]`, then extracts the second part.

This allows us to express the derivative of our function `f` as, simply `D(f)`:

```javascript
const Df = D(f);
console.log(Df(2));
// => 14
```

## Shortcomings

Our current `D` operator is not very ergonomic.
It requires us to know something about dual numbers, but this should really be
an implementation detail.
What we mean by this is that if you just want to find the _value_ of our
function $f$ at, say, $2$, you need to either know to express this as `f([2, 1])[0]`, or use some wrapper function, like:

```javascript
// "Lower" a function that operates on dual numbers to use JS numbers instead.
function lower(f) {
  return x => {
    const y = f([x, 1]);
    return y[0];
  };
}
```

to computea $f(2)$ as `lower(f)(2)`.

But there's a larger issue as well.
We currently have no way to compute second (or higher) derivatives using `D`.
We can try and hack around this by modifying `D` to return a function that
operates on dual numbers, but it involves making some dubious calls (try it!).

## Wishful Thinking

How would we _like_ this system to behave?
Ideally we could define a function like `h`:

```javascript
// h(x) = 2x^3 + x
function h(x) {
  return plus(times(2, pow(x, 3)), x);
}
```

and evaluate it "normally":

```javascript
console.log(h(2));
// => 18
```

or evaluate its derivative:

```javascript
console.log(D(h)(2));
// => 25
```

or its second derivative:

```javascript
console.log(D(D(h))(2));
// => 24
```

its third derivative, etc.

While we're at it, it'd be _great_ if `h` could operate on "generic" arithmetic
types, so long as they've implemented some basic "trait"/interface. For
instance, we might have a `Complex` class that implements complex number
arithmetic, in which case:

```javascript
// D(h)(1 + 2i)
console.log(D(h)(new Complex(1, 2)));
// => -17 + 24i
```

or an `Expr` class that builds a symbolic AST:

```javascript
console.log(D(h)(Expr.sym('a')));
// => 6a^2 + 1
```

So this defines one "axis" for our work: extending our operations and `D` to
work more generally.

We'd also like to be able to handle multivariate functions and collections.
For instance, if:

```javascript
// f(x, y) = (x^2y, 2y, x - y)
function f(x, y) {
  return [times(pow(x, 2), y), times(2, y), minus(x, y)];
}
```

then `D(f)` should produce the
[_Jacobian matrix_](https://en.wikipedia.org/wiki/Jacobian_matrix_and_determinant)
for `f`:

```javascript
console.log(D(f)(1, 2));
// => [[4, 4], [0, 2], [1, -1]]
```

At the same time, `D` would be able to compute partial derivatives, like:

```javascript
// The partial derivative of f with respect to its first parameter:
D(0, f);
```

So this is a second "axis".

Finally, we should support higher-order functions, like:

```javascript
function shift(u) {
  return f => x => {
    return f(plus(x, u));
  };
}
```

It's not immediately clear what kind of a thing `D(shift)` should be.
But we'll see (I think!) that functors hold the key here: we can treat returned
functions the same way we handle vectors.
