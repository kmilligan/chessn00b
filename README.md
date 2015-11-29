chessn00b
=========

A simplistic JavaScript chess engine plus a FEN-compatible display board.

Mostly a "just to see if I can" / "interesting challenge" project.

WTF is FEN?
-----------

[FEN](http://en.wikipedia.org/wiki/FEN) is a method of describing a given chess position.
For example:

    rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

describes the starting position for classical chess.


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

Options
-------

There are only two at the moment:

**fen** - provide the initial board state in FEN. Defaults to standard chess opening position.

**playGame** - boolean; should the engine attempt to play if a piece is moved? Defaults to true.

Limitations
-----------

Currently, the system doesn't understand en passant, draws, or the 50-move rule, and only looks 3-ply deep (because it's relatively slow). I'm working on making it faster first, then I'll tackle the rest.

Notes
-----

First pass, the internal board representation was a 2-D array of "square" objects. This worked, but then did some reading...

* https://cis.uab.edu/hyatt/boardrep.html
* https://chessprogramming.wikispaces.com/Board+Representation

...so I tried the "10x12" 1-D array representation. While a number of my test cases seemed to improve, the practical performance was about the same, as far as "nodes per second". I got a bigger performance gain by changing the way I cloned the board during the evaluation cycle; using a method that understands the board internals rather than setting it via FEN was much faster.

