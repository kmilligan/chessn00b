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
	$.fn.chessn00b = function(options)
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
	var ColorMap = BoardFactory.getColorMap();
	var FileMap = BoardFactory.getFileMap();

	var OpeningBook = 
	{
		"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR": [ "e7e5" ],
		"rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR": [ "g8f6" ],
		"rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR": [ "g8f6" ],
		"rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": [ "b8c6" ],
		"rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR": [ "g7g6" ]

	}

	/**
	* Object representing a specific, single square on the board.
	*/
	var DisplaySquare = {};

	DisplaySquare.init = function(square)
	{
		this.square = square;
		this.element = $('<div class="chessn00b-square">&nbsp;</div>');
		this.element[0].displaySquare = this;
		this.element.attr('rel', square.name);
		this.element.addClass(this.square.color == ColorMap.white?'chessn00b-light-square':'chessn00b-dark-square');

		return this;
	};

	DisplaySquare.lite = function()
	{
		this.element.addClass('chessn00b-square-lit');
	};
	
	DisplaySquare.unlite = function()
	{
		this.element.removeClass('chessn00b-square-lit');
	};

	DisplaySquare.toggleLite = function()
	{
		if(this.element.hasClass('chessn00b-square-lit'))
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
		this.lastClickedSquare = null;
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

				this.displaySquares[f][r] = Object.create(DisplaySquare).init(
				{ 
					file: f, 
					rank: r,
					color: this.board.getSquareColor(f,r),
					name: FileMap.name(f,r)
				});
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
			var rank = $('<div class="chessn00b-rank" rel="' + r + '"></div>');

			for(var f = 1; f < 9; f++)
			{
				rank.append(this.displaySquares[f][r].element);
			}
			
			this.element.append(rank);
		}

		// attach our promotion element
		this.element.append('<div class="chessn00b-promote">'
			+ '<a href="#" class="chessn00b-square promote-white" rel="Q">' + PieceMap['Q'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-black" rel="q">' + PieceMap['q'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-white" rel="R">' + PieceMap['R'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-black" rel="r">' + PieceMap['r'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-white" rel="B">' + PieceMap['B'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-black" rel="b">' + PieceMap['b'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-white" rel="N">' + PieceMap['N'] + '</a>' 
			+ '<a href="#" class="chessn00b-square promote-black" rel="n">' + PieceMap['n'] + '</a>' 
			+ '</div>');
		// attach our status element
		this.element.append('<div class="chessn00b-status">'
			+ '<span class="illegal-move">Illegal move. </span>'
			+ '<span class="your-move">Your move</span>'
			+ '<span class="game-over">Game Over. </span>'
			+ '<span class="you-win">You win!</span>'
			+ '<span class="you-lose">You win!</span>'
			+ '<span class="thinking">Thinking...</span>'
			+ '</div>');
		this.element.find('.illegal-move').hide();
		this.element.find('.thinking').hide();
		this.element.find('.game-over').hide();
		this.element.find('.you-lose').hide();
		this.element.find('.you-win').hide();
		if(!this.playGame)
			this.element.find('.your-move').hide();

		// need to set the height of our ranks automagically
		// unless they told us not too.
		this.autosetHeight();

		// setup our click handler
		var that = this;
		this.element.on('click', '.chessn00b-rank .chessn00b-square', function()
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
				' .chessn00b-square { font-size: ' 
				+ Math.ceil(width * 0.82) 
				+ 'px; ' // no space before px!
				+ ' height: ' + width + 'px; '
				+ ' line-height: ' + width + 'px; }';

		rule += '.' + this.id 
				+ ' .chessn00b-promote { '
				+ ' top: -' + Math.ceil(width * 4) + 'px; '
				+ 'left: ' + Math.ceil(width * 2) + 'px; '
				+ '}';

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

		this.element.find('.illegal-move').hide();

		if(this.lastClickedSquare)
		{
			// uhh same square; just move on.
			if(square[0] == this.lastClickedSquare)
			{
				this.lastClickedSquare.displaySquare.unlite();
				this.lastClickedSquare = null;
				return;
			}

			this.lastClickedSquare.displaySquare.unlite();

			var move = '' + this.lastClickedSquare.displaySquare.square.name
						+ square[0].displaySquare.square.name;

			var that = this;
			var continueMove = function()
			{
				if(!that.engine.isValidMove(move))
				{
					that.element.find('.illegal-move').show();
					that.lastClickedSquare = null;
					return;
				}


				that.engine.move(move);
				that.update();
				that.lastClickedSquare = null;

				if(that.playGame)
					that.autoMove();
			};

			// might be a promotion,
			// in which case we need more info
			if(this.engine.isPromotionPossible(move))
			{
				this.element.find('.chessn00b-promote').show();

				// which color to show?
				this.element.find('.chessn00b-promote .promote-white').show();
				this.element.find('.chessn00b-promote .promote-black').hide();

				// click handler
				this.element.on('click.promote', 'a', function()
				{
					that.element.off('click.promote');
					that.element.find('.chessn00b-promote').hide();
					move += $(this).attr('rel');
					//console.log('move is now: ' + move);
					continueMove();
					return false;
				});
			}
			else
			{
				continueMove();
			}

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
			var myMove;

			// see if we're in checkmate first
			if(that.engine.blackInCheckmate())
			{
				that.thinking = false;
				that.element.find('.thinking').hide();
				that.element.find('.game-over').show();
				that.element.find('.you-win').show();
				return;
			}

			// what about stalemate?


			// then check our opening book
			var book = OpeningBook[that.getFEN()];

			if(book)
			{
				var which = Math.round(Math.random() * (book.length - 1));
				myMove = book[which];
				console.log("book move used");
			}
			else
			{
				myMove = that.engine.getBestMoveForBlack();
			}

			that.engine.move(myMove);
			that.thinking = false;
			that.element.find('.thinking').hide();
			that.update();

			// see if they're in checkmate
			if(that.engine.whiteInCheckmate())
			{
				that.element.find('.game-over').show();
				that.element.find('.you-lose').show();
				return;
			}
			else
			{
				that.element.find('.your-move').show();
			}
		}, 0);
	};

	DisplayBoard.setFEN = function(fen)
	{
		this.board.setFEN(fen);
		this.update();
		//this.board.dump();
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
				if(!this.board.hasPiece(f, r))
					this.displaySquares[f][r].element.html('&nbsp;');

				this.displaySquares[f][r].element.html(PieceMap[this.board.getPiece(f, r)]);
			}
		}
	};
// end scope wrapper
})(jQuery);
