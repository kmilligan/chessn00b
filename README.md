chessn00b
=========

A simplistic JavaScript chess engine (plus display board).

Mostly a "just to see if I can" / "interesting challenge" project.

Usage
-----

The display board has a jQuery plugin hook, so assuming you've already included jQuery someplace, just add the following to your html head:

    <script src="chessn00b.min.js" type="text/javascript"></script>    
    <link rel="stylesheet" type="text/css" href="chessn00b.min.css" />
    <script type='text/javascript'>
        $(document).ready(function()
        {
            $('.board').chessn00b();
        });
    </script>

Limitations
-----------

Currently, the system doesn't understand pawn promotion, en passant, draws, or 50-move rule, and only looks 3-ply deep (because it's painfully slow). I'm working on making it faster first, then I'll tackle the rest.

Notes
-----

First pass, the internal board representation was a 2-D array of "square" objects. This worked, but then did some reading...

* https://cis.uab.edu/hyatt/boardrep.html
* https://chessprogramming.wikispaces.com/Board+Representation

...so I tried the "10x12" 1-D array representation. While a number of my test cases seemed to improve, the practical performance was about the same, as far as "nodes per second". Obviously, much more work to be done...


