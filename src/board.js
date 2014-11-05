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

	PieceMap.getColor = function(piece)
	{
		return (this.isWhite(piece)?ColorMap.white:ColorMap.black);
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

	FileMap.name = function(file, rank)
	{
		return FileMap[file] + rank; 
	};

	FileMap.coords = function(name)
	{
		return { 	
				file: parseInt(FileMap[name.substr(0,1)],10), 
				rank: parseInt(name.substr(1,1),10)
			};
	};

	// color names
	var ColorMap = 
	{
		white: 1,
		black: -1
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
		this.colorToMove = ColorMap.white;
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
		this.colorToMove = (parts[1] == 'w'?ColorMap.white:ColorMap.black);
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

	Board.getColorToMove = function()
	{
		return this.colorToMove;
	};

	Board.incrementMove = function()
	{
		if(this.colorToMove == ColorMap.white)
		{
			this.colorToMove = ColorMap.black;
		}
		else
		{
			this.colorToMove = ColorMap.white;
			this.fullMoveNumber++;
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

	Board.hasPiece = function(file, rank)
	{
		return this.squares[file][rank].hasPiece(); 
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

	Board.getCoveredSquares = function(file, rank)
	{
		var result = [];
		var diag = [];

		switch(this.getPiece(file, rank))
		{
			case 'K':
			case 'k':
				result = this.getStraightOptions(file,rank,1);
				diag = this.getDiagonalOptions(file,rank,1);
			break;
			case 'Q':
			case 'q':
				result = this.getStraightOptions(file,rank,8);
				diag = this.getDiagonalOptions(file,rank,8);
			break;
			case 'R':
			case 'r':
				result = this.getStraightOptions(file,rank,8);
			break;
			case 'B':
			case 'b':
				diag = this.getDiagonalOptions(file,rank,8);
			break;
			case 'N':
			case 'n':
				result = this.getKnightOptions(file,rank);
			break;
			case 'P':
			case 'p':
				result = this.getPawnOptions(file,rank);
			break;
			default:
				// nothing to do
			break;
		}

		// tack on the diag
		for(var i = 0; i < diag.length; i++)
			result.push(diag[i]);

		return result;
	};

	Board.getStraightOptions = function(file,rank,limit)
	{
		// keep track when we run into something in each direction
		var stop1 = false;
		var stop2 = false;
		var stop3 = false;
		var stop4 = false;
		//console.log(FileMap[file] + rank);
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9 && !stop1)
			{
				options.push(FileMap.name(file, rank + i));
				if(this.hasPiece(file, rank + i))
					stop1 = true;
			}

			if(file + i < 9 && !stop2)
			{
				options.push(FileMap.name(file + i, rank));
				if(this.hasPiece(file + i, rank))
					stop2 = true;
			}

			if(rank - i > 0 && !stop3)
			{
				options.push(FileMap.name(file, rank - i));
				if(this.hasPiece(file, rank - i))
					stop3 = true;
			}

			if(file - i > 0 && !stop4)
			{
				options.push(FileMap.name(file - i, rank));
				if(this.hasPiece(file - i, rank))
					stop4 = true;
			}
		}

		return options;
	};

	Board.getDiagonalOptions = function(file,rank,limit)
	{
		// keep track when we run into something in each direction
		var stop1 = false;
		var stop2 = false;
		var stop3 = false;
		var stop4 = false;
		var currF, currR;
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9)
			{
				currR = rank + i;
				if(file + i < 9 && !stop1)
				{
					currF = file + i;
					options.push(FileMap.name(currF, currR));
					if(this.hasPiece(currF, currR))
						stop1 = true;
				}

				if(file - i > 0 && !stop2)
				{
					currF = file - i;
					options.push(FileMap.name(currF, currR));
					if(this.hasPiece(currF, currR))
						stop2 = true;
				}
			}

			if(rank - i > 0)
			{
				currR = rank - i;
				if(file + i < 9 && !stop3)
				{
					currF = file + i;
					options.push(FileMap.name(currF, currR));
					if(this.hasPiece(currF, currR))
						stop3 = true;
				}

				if(file - i > 0 && !stop4)
				{
					currF = file - i;
					options.push(FileMap.name(currF, currR));
					if(this.hasPiece(currF, currR))
						stop4 = true;
				}
			}
		}

		return options;
	};

	Board.getKnightOptions = function(file,rank)
	{
		var options = [];
		// check to the left...
		if(file - 1 > 0)
		{
			if(rank + 2 < 9)
				options.push(FileMap.name(file - 1, rank + 2));

			if(rank - 2 > 0)
				options.push(FileMap.name(file - 1, rank - 2));

			if(file - 2 > 0)
			{
				if(rank + 1 < 9)
					options.push(FileMap.name(file - 2, rank + 1));

				if(rank - 1 > 0)
					options.push(FileMap.name(file - 2, rank - 1));
			}
		}

		// ...now to the right
		if(file + 1 < 9)
		{
			if(rank + 2 < 9)
				options.push(FileMap.name(file + 1, rank + 2));

			if(rank - 2 > 0)
				options.push(FileMap.name(file + 1, rank - 2));

			if(file + 2 < 9)
			{
				if(rank + 1 < 9)
					options.push(FileMap.name(file + 2, rank + 1));

				if(rank - 1 > 0)
					options.push(FileMap.name(file + 2, rank - 1));
			}
		}

		return options;
	};

	Board.getPawnOptions = function(file,rank)
	{
		var options = [];

		// need the color for direction
		if(PieceMap.isWhite(this.getPiece(file, rank)))
		{
			if(rank < 8)
			{
				if(file > 1)
					options.push(FileMap.name(file - 1, rank + 1));

				if(file < 8)
					options.push(FileMap.name(file + 1, rank + 1));
			}
		}
		else
		{
			if(rank > 1)
			{
				if(file > 1)
					options.push(FileMap.name(file - 1, rank - 1));

				if(file < 8)
					options.push(FileMap.name(file + 1, rank - 1));
			}
		}

		return options;
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
		};

		that.getColorMap = function()
		{
			return ColorMap;
		};

		return that;
	})();
})();
