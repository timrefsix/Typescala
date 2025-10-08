# Mandelbrot Script Requirements

This document summarizes the pieces of the Typescala runtime that make it
possible to write a Mandelbrot renderer and how to display the set on the built
in playground canvas.

## What already exists

The interpreter already exposes the primitives you would use to implement the
iteration that drives the Mandelbrot calculation:

- Numbers, booleans, strings, functions, and iterators are the only value kinds
  available to programs. That is enough to store coordinates, counters, and the
  characters used for ASCII output. 【F:src/values.ts†L1-L34】
- Numeric arithmetic and comparisons are implemented as method-like infix
  operators (`plus`, `minus`, `times`, `dividedBy`, etc.), so you can square and
  combine the real/imaginary parts of `z` and `c` just like in the usual
  algorithm. 【F:src/interpreter.ts†L205-L268】
- Control-flow constructs cover both counted loops (`for` with a range iterator)
  and condition-driven loops via the native `while` helper, which is exactly
  what the iterative escape-time algorithm needs. 【F:src/parser.ts†L93-L128】【F:src/interpreter.ts†L77-L137】【F:src/interpreter.ts†L305-L339】
- String concatenation through the `plus` operator and the native `print`
  function let you build and emit text rows, making a simple ASCII plot
  achievable already. 【F:src/interpreter.ts†L269-L303】【F:src/interpreter.ts†L318-L339】

With these pieces you can already compute the iteration counts and print a
character map for the set in the console.

## What is still missing

Typescala now exposes a handful of native helpers for producing pixel output:

- `canvas(width, height)` allocates an opaque bitmap that the interpreter keeps
  backed by a `Uint8ClampedArray`. 【F:src/runtime.ts†L87-L117】【F:src/interpreter.ts†L343-L353】
- `canvasWidth(canvas)` and `canvasHeight(canvas)` return the dimensions so that
  loops can derive their iteration bounds. 【F:src/interpreter.ts†L355-L365】
- `fillCanvas(canvas, r, g, b, a?)` paints the entire buffer in a single call.
  【F:src/interpreter.ts†L367-L382】
- `setPixel(canvas, x, y, r, g, b, a?)` writes an individual pixel after
  clamping coordinates and channel values. 【F:src/interpreter.ts†L384-L406】

When a script returns a canvas value, the playground renders it inside the
output panel by copying the pixel buffer into an HTML `<canvas>` element.
【F:src/ui/app.ts†L32-L71】 This means a Mandelbrot program can focus purely on
the numerical escape-time algorithm and let the host handle visualization.

The following snippet demonstrates a complete renderer using the built-ins:

```scala
let width = 60
let height = 40
let maxIterations = 40

let image = canvas(width, height)

for py in 0..height {
  let imaginary = (py / height) * 2.4 - 1.2
  for px in 0..width {
    let real = (px / width) * 3.5 - 2.5
    let zx = 0
    let zy = 0
    let iteration = 0
    let escaped = false
    let escapeCount = maxIterations

    while(() => iteration < maxIterations, () => {
      let xSquared = zx * zx
      let ySquared = zy * zy

      if (xSquared + ySquared > 4) {
        escaped = true
        escapeCount = iteration
        iteration = maxIterations
      } else {
        let twoXY = zx * zy * 2
        let nextX = xSquared - ySquared + real
        zy = twoXY + imaginary
        zx = nextX
        iteration = iteration + 1
      }
    })

    if (escaped) {
      let intensity = (escapeCount / maxIterations) * 255
      setPixel(image, px, py, intensity, intensity, intensity)
    } else {
      setPixel(image, px, py, 0, 0, 0)
    }
  }
}

image
```

Running this code in the playground will produce a grayscale Mandelbrot set in
the output region. 【F:tests/mandelbrot.test.ts†L1-L77】
