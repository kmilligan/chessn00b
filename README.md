chessn00b
=========

A simplistic JavaScript chess engine (plus display board).

Mostly a "just to see if I can" project.

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
 
