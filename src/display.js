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

		options.displayGameScore = false;
		if(typeof options.gameScoreSelector === 'undefined')
		{
			options.displayGameScore = false;
		}
		else if(typeof options.gameScoreSelector === 'string')
		{
			this.gameScoreElement = $(options.gameScoreSelector);
			if(this.gameScoreElement.length > 0)
				options.displayGameScore = true;
		}

		if(typeof options.notationType === 'undefined')
			options.notationType = 'SAN';

		if(typeof options.coordinates !== 'boolean')
			options.coordinates = false;

		this.element = options.element;
		this.board = BoardFactory.create();
		this.engine = EngineFactory.create(this.board);
		this.playGame = options.playGame;
		this.lastClickedSquare = null;
		this.displaySquares = [];
		this.thinking = false;
		this.options = options;
		this.gameScore = '';
		this.currentPieceCount = this.board.getPieceCount();

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
		this.element.append('<div class="chessn00b-outer-board"><div class="chessn00b-inner-board"></div></div>');
		var innerBoard = this.element.find('.chessn00b-inner-board');
		var outerBoard = this.element.find('.chessn00b-outer-board');

		// squares...
		for(var r = 8; r > 0; r--)
		{
			// container div for each rank
			// to keep things from spilling
			var rank = $('<div class="chessn00b-rank" rel="' + r + '"></div>');

			for(var f = 1; f < 9; f++)
			{
				rank.append(this.displaySquares[f][r].element);
			}
			
			innerBoard.append(rank);
		}

		// coordinates...
		if(this.options.coordinates)
		{
			var files = $('<div class="chessn00b-file-markers"></div>');
			for(var f = 1; f < 9; f++)
				files.append('<div class="chessn00b-file-marker">' + FileMap[f] + '</div>');

			var ranks = $('<div class="chessn00b-rank-markers"></div>');
			for(var r = 8; r > 0; r--)
				ranks.append('<div class="chessn00b-rank-marker">' + r + '</div>');

			outerBoard.append(ranks);
			outerBoard.append(files);
		}

		// attach our status element
		// TODO separate out the strings for translation
		// also, only show the one we need? 
		this.element.append('<div class="chessn00b-status">'
			+ '<span class="illegal-move">Illegal move. </span>'
			+ '<span class="your-move">Your move</span>'
			+ '<span class="game-over">Game Over. </span>'
			+ '<span class="you-win">You win!</span>'
			+ '<span class="you-lose">You lose!</span>'
			+ '<span class="draw">Draw.</span>'
			+ '<span class="thinking">Thinking...</span>'
			+ '</div>');
		this.element.find('.illegal-move').hide();
		this.element.find('.thinking').hide();
		this.element.find('.game-over').hide();
		this.element.find('.you-lose').hide();
		this.element.find('.you-win').hide();
		this.element.find('.draw').hide();

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

		this.element.append('<div class="chessn00b-animator chessn00b-square"></div>');

		// if we're just a display board, don't need the status
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
		// this assumes the inner board isn't floated, which it needs to be...
		//var width = this.displaySquares[1][1].element.width();
		var width = Math.ceil(this.element.width() / 9);

		// setup our dynamic css
		if(typeof this.dynCSS == 'undefined')
		{
			this.dynCSS = document.createElement('style');
			document.getElementsByTagName('head')[0].appendChild(this.dynCSS);
		}	

		var rule = '.' + this.id +
				' .chessn00b-inner-board, .chessn00b-file-markers { '
				+ 'width: ' + (width * 8) + 'px; '
				+ '}';

		rule += '.' + this.id +
				' .chessn00b-square { font-size: ' 
				+ Math.ceil(width * 0.82) 
				+ 'px; ' // no space before px!
				+ ' height: ' + width + 'px; '
				+ ' line-height: ' + width + 'px; }';

		rule += '.' + this.id +
				' .chessn00b-rank-marker {'
				+ ' height: ' + width + 'px; '
				+ ' line-height: ' + width + 'px; }';

		rule += '.' + this.id 
				+ ' .chessn00b-promote { '
				+ ' top: -' + Math.ceil(width * 5) + 'px; '
				+ 'left: ' + Math.ceil(width * 2.2) + 'px; '
				+ '}';

		rule += '.' + this.id 
				+ ' .chessn00b-animator { '
				+ ' width: ' + width + 'px; }';

		// IE does it differently...
		if(this.dynCSS.styleSheet)
			this.dynCSS.styleSheet.cssText = rule;
		else	
			this.dynCSS.innerHTML = rule;
	}

	DisplayBoard.squareClicked = function(square)
	{
		// hey! computer turn!
		if(this.thinking)
			return;

		// clear any errors
		this.element.find('.illegal-move').hide();

		// first click?
		if(!this.lastClickedSquare)
		{
			square[0].displaySquare.lite();
			this.lastClickedSquare = square[0];
			return;
		}

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
			that.update(move);
			that.lastClickedSquare = null;

			if(that.playGame)
				that.autoMove();
		};

		// might be a promotion,
		// in which case we need more info
		if(this.engine.isPromotionPossible(move))
		{
			this.element.find('.chessn00b-promote').css('display', 'inline-block');

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

			// see if we're in checkmate or stalemate first
			var checkmate = that.engine.blackInCheckmate();
			var stalemate = that.engine.inStalemate(false);
			if(checkmate || stalemate)
			{
				that.thinking = false;
				that.element.find('.thinking').hide();
				that.element.find('.game-over').show();
				if(checkmate)
					that.element.find('.you-win').show();
				else
					that.element.find('.draw').show();

				return;
			}

			// what about stalemate?


			var completeMove = function(myMove)
			{
				that.engine.move(myMove);
				that.animate(myMove);
				that.thinking = false;
				that.element.find('.thinking').hide();

				// see if they're in checkmate / stalemate
				checkmate = that.engine.whiteInCheckmate();
				stalemate = that.engine.inStalemate(true);
				if(checkmate || stalemate)
				{
					that.element.find('.game-over').show();
					if(checkmate)
						that.element.find('.you-lose').show();
					else
						that.element.find('.draw').show();

					return;
				}
				else
				{
					that.element.find('.your-move').show();
				}
			};

			// then check our opening book
			var book = OpeningBook[that.getFEN()];
			if(book)
			{
				var which = Math.round(Math.random() * (book.length - 1));
				myMove = book[which];
				//console.log("book move used");
				completeMove(myMove);
			}
			else
			{
				myMove = that.engine.getBestMove(false, completeMove);
			}
		// attempt to let the UI do other things
		}, 20);
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

	DisplayBoard.update = function(move)
	{
		this.updateDisplayBoard();

		if(typeof move === 'undefined')
			return;

		// add to our move list
		this.updateGameScore(move);
	};

	DisplayBoard.updateDisplayBoard = function()
	{
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.hasPiece(f, r))
				{
					this.displaySquares[f][r].element.html('&nbsp;');
					continue;
				}

				this.displaySquares[f][r].element.html(PieceMap[this.board.getPiece(f, r)]);
			}
		}
	};

	DisplayBoard.updateGameScore = function(move)
	{
		// was there a capture?
		var pieceCount = this.board.getPieceCount();
		var capture = false;
		if(pieceCount < this.currentPieceCount)
			capture = true;

		this.currentPieceCount = pieceCount;

		var score = '';
		if(this.board.colorToMove != ColorMap.white)
			score += ''+ this.board.fullMoveNumber +'. ';

		score += this.convertNotation(move, capture);
		
		if(this.board.colorToMove == ColorMap.white
			&& this.engine.whiteInCheck())
			score += '+';
		else if(this.board.colorToMove == ColorMap.black
			&& this.engine.blackInCheck())
			score += '+';

		score += ' ';

		// have to come up with a more flexible method.
		this.gameScore += score;

		if(!this.options.displayGameScore)
			return;

		this.gameScoreElement.html(this.gameScore);
	};

	DisplayBoard.convertNotation = function(move, capture)
	{
		var startCoords = FileMap.coords(move.substr(0,2));
		var endCoords = FileMap.coords(move.substr(2,2));
		var end = move.substr(2,3);

		var piece = this.board.getPiece(endCoords.file, endCoords.rank);

		var notation;
		// if it's a pawn, we never show it...
		if(piece == 'p' || piece == 'P')
		{
			//...unless there is a capture
			if(capture)
				notation = move.substr(0,1) + 'x' + end;
			else
				notation = end;
		}
		// if it's a King, watch out for castling
		else if((piece == 'k' || piece == 'K')
			&& (Math.abs(startCoords.file - endCoords.file) == 2))
		{
			// which way?
			if(startCoords.file < endCoords.file)
				notation = 'O-O';
			else
				notation = 'O-O-O';
		}
		else
		{
			if(this.options.notationType == 'FAN')
				notation = PieceMap[piece];
			else
				notation = piece.toUpperCase();

			if(capture)
				notation += 'x';

			notation += end;
		}

		return notation;
	};

	DisplayBoard.animate = function(move)
	{
		var start = FileMap.coords(move.substr(0,2));
		var end = FileMap.coords(move.substr(2,2));
		//console.log(move);
		var destination = this.displaySquares[end.file][end.rank].element.offset();
		var frame = this.element.find('.chessn00b-animator');

		var startSquareOffset = this.displaySquares[start.file][start.rank].element.offset();

		// remember; the piece has already moved on the internal board.
		frame
			.html(PieceMap[this.board.getPiece(end.file, end.rank)]);

		// remove the piece from the starting place...
		this.displaySquares[start.file][start.rank].element.html('&nbsp;');

		// ...and animate the rest
		var that = this;
		frame
			// this ends up being relative
			//.offset(startSquareOffset)
			.css('top', startSquareOffset.top + 'px')
			.css('left', startSquareOffset.left + 'px')
			.css('display', 'block')
			.animate({
				left: destination.left,
				top: destination.top
			}, 
			// how long...
			400,
			// when done...
			function()
			{
				frame.css('display', 'none');

				// this will also deal with stuff like castling
				that.update(move);
			});
	};
// end scope wrapper
})(jQuery);
