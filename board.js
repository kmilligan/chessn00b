//"use strict";

// access point
var BoardFactory;

// scope wrapper
(function() 
{
	"use strict";

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
	var FileMap =
	{
		'1': 'a',
		'2': 'b',
		'3': 'c',
		'4': 'd',
		'5': 'e',
		'6': 'f',
		'7': 'g',
		'8': 'h'
	};

	/**
	* Object representing a specific, single square on the board.
	*/
	var Square = {};

	/**
	* Setup; determine our color, add click handlers
	*/
	Square.init = function(board, file, rank)
	{
		this.board = board;
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

		// initialize our Squares
		this.squares = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				// allocate our array
				if(r == 1)
					this.squares[f] = [];
				this.squares[f][r] = Object.create(Square).init(this, f, r);
			}
		}

		return this;
	};

	Board.setPiece = function(piece, file, rank)
	{
		this.squares[file][rank].setPiece(piece);
	}
	
	Board.removePiece = function(file, rank)
	{
		this.squares[file][rank].removePiece();
	}

	Board.getPiece = function(file, rank)
	{
		return this.squares[file][rank].getPiece(); 
	};

	Board.getSquare = function(file, rank)
	{
		return this.squares[file][rank];
	};

	Board.isWhiteToMove = function()
	{
		return (this.colorToMove == 1?true:false);
	};

	Board.getWhitesCoveredSquares = function()
	{
		this.determineCoveredSquares();
		return this.whiteCoveredSquares;
	};

	Board.getBlacksCoveredSquares = function()
	{
		this.determineCoveredSquares();
		return this.blackCoveredSquares;
	};

	Board.determineCoveredSquares = function()
	{
		this.whiteCoveredSquares = [];
		this.blackCoveredSquares = [];

		// loop all the squares, finding the ones with pieces
		// for each piece, determine coverage
		var covered;
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				covered = this.getCoveredSquares(f,r);

				// push onto the appropriate color array
				var arr = this.blackCoveredSquares;
				if(PieceMap.isWhite(this.squares[f][r].getPiece()))
					arr = this.whiteCoveredSquares;

				for(var i = 0; i < covered.length; i++)
					arr.push(covered[i]);
			}
		}
	};

	Board.getCoveredSquares = function(file, rank)
	{
		var result = [];
		var diag = [];

		switch(this.squares[file][rank].getPiece())
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
				options.push(this.squares[file][rank + i]);
				if(this.squares[file][rank + i].hasPiece())
					stop1 = true;
			}

			if(file + i < 9 && !stop2)
			{
				options.push(this.squares[file + i][rank]);
				if(this.squares[file + i][rank].hasPiece())
					stop2 = true;
			}

			if(rank - i > 0 && !stop3)
			{
				options.push(this.squares[file][rank - i]);
				if(this.squares[file][rank - i].hasPiece())
					stop3 = true;
			}

			if(file - i > 0 && !stop4)
			{
				options.push(this.squares[file - i][rank]);
				if(this.squares[file + i][rank].hasPiece())
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
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop1 = true;
				}

				if(file - i > 0 && !stop2)
				{
					currF = file - i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop2 = true;
				}
			}

			if(rank - i > 0)
			{
				currR = rank - i;
				if(file + i < 9 && !stop3)
				{
					currF = file + i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop3 = true;
				}

				if(file - i > 0 && !stop4)
				{
					currF = file - i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop4 = true;
				}
			}
		}

		return options;
	};

	Board.getKnightOptions = function(file,rank)
	{
		var options = [];
		if(file - 1 > 0)
		{
			if(rank + 2 < 9)
				options.push(this.squares[file - 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.squares[file - 1][rank - 2]);

			if(file - 2 > 0)
			{
				if(rank + 1 < 9)
					options.push(this.squares[file - 2][rank + 1]);

				if(rank - 1 < 9)
					options.push(this.squares[file - 2][rank - 1]);
			}
		}

		if(file + 1 < 9)
		{
			if(rank + 2 < 9)
				options.push(this.squares[file + 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.squares[file + 1][rank - 2]);

			if(file + 2 < 9)
			{
				if(rank + 1 < 9)
					options.push(this.squares[file + 2][rank + 1]);

				if(rank - 1 < 9)
					options.push(this.squares[file + 2][rank - 1]);
			}
		}

		return options;
	};

	Board.getPawnOptions = function(file,rank)
	{
		var options = [];
		
		// need the color for direction
		if(PieceMap.isWhite(this.squares[file][rank].getPiece()))
		{
			if(rank < 8)
			{
				if(file > 1)
					options.push(this.squares[file - 1][rank + 1]);

				if(file < 8)
					options.push(this.squares[file + 1][rank + 1]);
			}
		}
		else
		{
			if(rank > 1)
			{
				if(file > 1)
					options.push(this.squares[file - 1][rank - 1]);

				if(file < 8)
					options.push(this.squares[file + 1][rank - 1]);
			}
		}
		
		return options;
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

	// create a new board
	BoardFactory = (function()
	{
		var that = {};
		
		that.create = function()
		{
			return Object.create(Board).init();
		};

		return that;
	})();
// end scope wrapper
})();
