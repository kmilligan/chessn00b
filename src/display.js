/**
* The "display" version of the board.
* Meant to be used along side an engine.
*
*@author Kurt Milligan
*/

// scope wrapper
(function($)
{
	"use strict";

	/**
	* Attach ourselves to jQuery so we can be used as a plugin
	*/
	$.fn.fenview = function(options)
	{
		return this.each(function(options)
		{
			// already have one?
			if(this.displayboard)
				return;

			// options?
			var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			if(options.fen)
				fen = options.fen;

			// create!
			this.displayboard = Object.create(DisplayBoard).init($(this));
			this.displayboard.setFEN(fen);
		});
	};

	// map pieces to unicode
	var PieceMap = BoardFactory.getPieceMap();

	/**
	* Object representing a specific, single square on the board.
	*/
	var DisplaySquare = {};

	DisplaySquare.init = function(square)
	{
		this.square = square;
		this.element = $('<div class="fenview-square">&nbsp;</div>');
		this.element[0].displaySquare = this;
		this.element.attr('rel', this.square.name);
		this.element.addClass(this.square.color?'fenview-light-square':'fenview-dark-square');

		return this;
	};

	// match our view to the underlying square
	DisplaySquare.update = function()
	{
		if(!this.square.hasPiece())
		{
			this.element.html('&nbsp;');
			return;
		}

		this.element.html(PieceMap[this.square.getPiece()]);
	};

	DisplaySquare.lite = function()
	{
		this.element.addClass('square-lit');
	};
	
	DisplaySquare.unlite = function()
	{
		this.element.removeClass('square-lit');
	};

	DisplaySquare.toggleLite = function()
	{
		if(this.element.hasClass('square-lit'))
			this.unlite();
		else
			this.lite();
	};

	/**
	* Object representing the display chess board itself
	*/
	var DisplayBoard = {};	
	DisplayBoard.init = function(element)
	{
		this.element = element;
		this.board = BoardFactory.create();
		this.displaySquares = [];

		// need to track our board uniquely
		// for sizing purposes
		this.id = 'board' + Math.floor(Math.random() * 1000000);
		this.element.addClass(this.id);

		// initialize our DisplaySquares
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				// allocate our array
				if(r == 1)
					this.displaySquares[f] = [];

				this.displaySquares[f][r] = Object.create(DisplaySquare).init(this.board.squares[f][r]);
			}
		}

		this.createDisplay();
		return this;
	}

	/**
	* create the actual display for the board
	*/
	DisplayBoard.createDisplay = function()
	{
		for(var r = 8; r > 0; r--)
		{
			// container div for each rank
			// to keep things from spilling
			var rank = $('<div class="fenview-rank" rel="' + r + '"></div>');

			for(var f = 1; f < 9; f++)
			{
				rank.append(this.displaySquares[f][r].element);
			}
			
			this.element.append(rank);
		}

		// need to set the height of our ranks automagically
		// unless they told us not too.
		this.autosetHeight();

		// setup our click handler
		var that = this;
		this.element.on('click', '.fenview-square', function()
		{
			that.squareClicked($(this));
		});
	}

	DisplayBoard.autosetHeight = function()
	{
		var width = this.displaySquares[1][1].element.width();	

		// setup our dynamic css
		if(typeof this.dynCSS == 'undefined')
		{
			this.dynCSS = document.createElement('style');
			document.getElementsByTagName('head')[0].appendChild(this.dynCSS);
		}	

		var rule = '.' + this.id +
				' .fenview-square { font-size: ' 
				+ Math.ceil(width * 0.82) 
				+ 'px; ' + // no space before px!
				' height: ' + width + 'px; }';
		
		// IE does it differently...
		if(this.dynCSS.styleSheet)
			this.dynCSS.styleSheet.cssText = rule;
		else	
			this.dynCSS.innerHTML = rule;
	}

	DisplayBoard.squareClicked = function(square)
	{
		square[0].displaySquare.toggleLite();		
	};

	DisplayBoard.setFEN = function(fen)
	{
		this.board.setFEN(fen);
		this.update();
	};

	DisplayBoard.update = function()
	{
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				this.displaySquares[f][r].update();
			}
		}
	};
// end scope wrapper
})(jQuery);
