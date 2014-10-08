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
		if(!options)
			options = {};

		if(typeof options == 'string'
			&& this.length == 1
			&& this[0].displayboard)
		{
			// just asking for something
			// of course, this assumes there is only one atm...
			switch(options)
			{
				case 'fen':
					return this[0].displayboard.getFEN();
					break;
				default:
					return 'unsupported option';
			}
		}

		return this.each(function()
		{
			// already have one?
			if(this.displayboard)
				return;

			// options?
			var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			if(options.fen)
				fen = options.fen;

			options.element = $(this);

			// create!
			this.displayboard = Object.create(DisplayBoard).init(options);
			this.displayboard.setFEN(fen);
		});
	};

	// map pieces to unicode
	var PieceMap = BoardFactory.getPieceMap();

	var OpeningBook = 
	{
		
	}

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
	DisplayBoard.init = function(options)
	{
		// have what we need?
		if(!options || !options.element)
			throw new Error('Missing options; requires at least "element" to attach to.');

		// defaults
		if(typeof options.playGame === 'undefined')
			options.playGame = true;

		this.element = options.element;
		this.board = BoardFactory.create();
		this.engine = EngineFactory.create(this.board);
		this.playGame = options.playGame;
		this.lastClickedSquare;
		this.displaySquares = [];
		this.thinking = false;

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

		// attach our status element
		this.element.append('<div class="fenview-status"><span class="your-move">Your move</span><span class="thinking">Thinking...</span></div>');
		this.element.find('.thinking').hide();
		// need to set the height of our ranks automagically
		// unless they told us not too.
		this.autosetHeight();

		// setup our click handler
		var that = this;
		this.element.on('click', '.fenview-square', function()
		{
			that.squareClicked($(this));
			return false;
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
				+ 'px; ' // no space before px!
				+ ' height: ' + width + 'px; '
				+ ' line-height: ' + width + 'px; }';
		
		// IE does it differently...
		if(this.dynCSS.styleSheet)
			this.dynCSS.styleSheet.cssText = rule;
		else	
			this.dynCSS.innerHTML = rule;
	}

	DisplayBoard.squareClicked = function(square)
	{
		if(this.thinking)
			return;

		if(this.lastClickedSquare)
		{
			// uhh same square; just move on.
			if(square[0] == this.lastClickedSquare)
			{
				this.lastClickedSquare.unlite();
				this.lastClickedSquare = null;
				return;
			}

			this.lastClickedSquare.displaySquare.unlite();

			var move = '' + this.lastClickedSquare.displaySquare.square.name
						+ square[0].displaySquare.square.name;

			this.engine.move(move);
			this.update();
			this.lastClickedSquare = null;

			if(this.playGame)
				this.autoMove();

			return;
		}

		square[0].displaySquare.lite();
		this.lastClickedSquare = square[0]; 
	};

	DisplayBoard.autoMove = function()
	{
		this.thinking = true;
		this.element.find('.your-move').hide();
		this.element.find('.thinking').show();
		var that = this;
		setTimeout(function()
		{
			var engineMove = that.engine.getBestMoveForBlack();
			that.engine.move(engineMove);
			that.thinking = false;
			that.element.find('.thinking').hide();
			that.element.find('.your-move').show();
			that.update();
		}, 0);
	};

	DisplayBoard.setFEN = function(fen)
	{
		this.board.setFEN(fen);
		this.update();
	};

	DisplayBoard.getFEN = function()
	{
		return this.engine.getPositionFEN();
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
