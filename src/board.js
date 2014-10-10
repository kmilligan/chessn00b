/**
* Base classes for our board, square, etc.
*
*@author Kurt Milligan
*/

// access point
var BoardFactory;

// scope wrapper
(function() 
{
	"use strict";

	/**
	* This helps us with inheritence, and not all browsers have it yet.
	*@see http://javascript.crockford.com/prototypal.html
	*/
	if(typeof Object.create !== 'function')
	{
		Object.create = function (o)
		{
			function F() {};
			F.prototype = o;
			return new F();
		};
	}	

	// Map of pieces to unicode characters
	var PieceMap =
	{
		'R': '\u2656',
		'N': '\u2658',
		'B': '\u2657',
		'Q': '\u2655',
		'K': '\u2654',
		'P': '\u2659',
		'r': '\u265c',
		'n': '\u265e',
		'b': '\u265d',
		'q': '\u265b',
		'k': '\u265a',
		'p': '\u265f'
	};

	PieceMap.isWhite = function(piece)
	{
		return(piece.charCodeAt(0) < 91?true:false);
	};

	// Map file numbers to letter names
	// and vice versa
	var FileMap =
	{
		'1': 'a',
		'2': 'b',
		'3': 'c',
		'4': 'd',
		'5': 'e',
		'6': 'f',
		'7': 'g',
		'8': 'h',
		'a': '1',
		'b': '2',
		'c': '3',
		'd': '4',
		'e': '5',
		'f': '6',
		'g': '7',
		'h': '8'
	};

	/**
	* Object representing a specific, single square on the board.
	*/
	var Square = {};

	/**
	* Setup; determine our color, name, etc
	*/
	Square.init = function(file, rank)
	{
		this.file = file;
		this.rank = rank;
		this.color = 0;
		this.name = FileMap[file] + rank; 
		this.piece = '';

		// figure out our color
		var fileEven = (file % 2 == 0);
		var fileOdd = !fileEven;
		var rankEven = (rank % 2 == 0);
		var rankOdd = !rankEven;
		if((fileOdd && rankEven)
			|| (fileEven && rankOdd))
			this.color = 1;
	
		return this;
	};

	Square.setPiece = function(piece)
	{
		if(PieceMap[piece] === 'undefined')
			throw new Error('Invalid piece');

		this.piece = piece;
	};

	Square.removePiece = function()
	{
		this.piece = '';
	};

	Square.hasPiece = function()
	{
		return (this.piece == ''?false:true);
	};

	Square.getPiece = function()
	{
		return this.piece;
	};

	Square.isWhite = function()
	{
		return (this.color == 1?true:false);
	};

	/**
	* Object representing the chess board itself;
	* contains Squares, and various helper fn's to set the state
	*/
	var Board = {};	
	Board.init = function()
	{
		this.colorToMove = 1;
		this.castlingOptions = '-';
		this.enpassantTarget = '-';
		this.halfMoveClock = 0;
		this.fullMoveNumber = 0;

		// initialize our Squares
		this.squares = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				// allocate our array
				if(r == 1)
					this.squares[f] = [];
				this.squares[f][r] = Object.create(Square).init(f, r);
			}
		}

		return this;
	};

	Board.isWhiteToMove = function()
	{
		return (this.colorToMove == 1?true:false);
	};

	Board.setFEN = function(fen)
	{
		var parts = fen.split(' ');

		// setup the pieces
		var ranks = parts[0].split('/');
		for(var rank = 8; rank > 0; rank--)
		{
			this.setRankFEN(rank, ranks[8 - rank]);	
		}

		// setup the state
		this.colorToMove = (parts[1] == 'w'?1:0);
		if(parts[2])
			this.castlingOptions = parts[2];
		
		if(parts[3])
			this.enpassantTarget = parts[3];

		if(typeof parts[4] != 'undefined')
			this.halfMoveClock = parseInt(parts[4], 10);

		if(typeof parts[5] != 'undefined')
			this.fullMoveNumber = parseInt(parts[5], 10);
	};

	Board.setRankFEN = function(rank, fen)
	{
		var sqs = fen.split('');
		var file = 1;
		for(var idx in sqs)
		{
			// may have reached the end
			if(file > 8 || sqs[idx] == ' ')
				break;

			if(PieceMap[sqs[idx]])
			{
				this.setPiece(sqs[idx], file, rank);
				file++;
			}
			else
			{
				// numeric. spaces.
				while(sqs[idx] > 0)
				{
					this.removePiece(file, rank);
					sqs[idx]--;
					file++;
				}
			}
		}
	};

	Board.setPiece = function(piece, file, rank)
	{
		this.squares[file][rank].setPiece(piece);
	};
	
	Board.removePiece = function(file, rank)
	{
		this.squares[file][rank].removePiece();
	};

	Board.getPiece = function(file, rank)
	{
		return this.squares[file][rank].getPiece(); 
	};

	Board.getSquare = function(file, rank)
	{
		// might have given us algebraic
		if(typeof rank == 'undefined'
			&& typeof file == 'string')
		{
			rank = file.substr(1,1);
			file = FileMap[file.substr(0,1)];
		}

		return this.squares[file][rank];
	};

	Board.dump = function()
	{
		var divider = '-----------------';
		console.log(divider);
		for(var r = 8; r > 0; r--)
		{
			var rankOut = '|';
			for(var f = 1; f < 9; f++)
			{
				if(!this.squares[f][r].hasPiece())
					rankOut += ' ';
				else
					rankOut += this.squares[f][r].getPiece();

				rankOut += '|';
			}
			console.log(rankOut);
			console.log(divider);
		}
	}

	// create a new board, provide access to some helpers
	BoardFactory = (function()
	{
		var that = {};
		
		that.create = function()
		{
			return Object.create(Board).init();
		};

		that.getPieceMap = function()
		{
			return PieceMap;
		};

		that.getFileMap = function()
		{
			return FileMap;
		}

		return that;
	})();
})();
