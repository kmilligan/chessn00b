/**
* Simple javascript chess engine.
*
*@author Kurt Milligan
*/

// have what we need?
if(typeof BoardFactory === 'undefined')
{
	// because throwing doesn't always render??
	if(console)
		console.log('Missing the BoardFactory!');
	throw new Error('Missing the BoardFactory!');
}

// access point
var EngineFactory;

// scope wrapper
(function() 
{
	"use strict";

	var PieceMap = BoardFactory.getPieceMap();
	var ColorMap = BoardFactory.getColorMap();
	var FileMap = BoardFactory.getFileMap();

	/**
	* Object representing the engine;
	* hasA board
	*/
	var Engine = {};	
	Engine.init = function(board)
	{
		this.board = board;
		this.searchPly = 2;
		this.resetCaches();
		return this;
	};

	Engine.resetCaches = function()
	{
		this.whiteCoveredSquares = [];
		this.blackCoveredSquares = [];
		this.whiteStaticValue = 0;
		this.blackStaticValue = 0;
		this.whiteDynamicValue = 0;
		this.blackDynamicValue = 0;
		this.cachedPositionFEN = null;
		this.validWhiteMoves = [];
		this.validBlackMoves = [];
	};

	Engine.setFEN = function(fen)
	{
		this.resetCaches();
		this.board.setFEN(fen);
	};

	Engine.getWhitesCoveredSquares = function()
	{
		this.determineCoveredSquares(true);
		return this.whiteCoveredSquares;
	};

	Engine.getBlacksCoveredSquares = function()
	{
		this.determineCoveredSquares(false);
		return this.blackCoveredSquares;
	};

	Engine.getValidMovesForWhite = function()
	{
		this.determineValidMoves(true);
		return this.validWhiteMoves;
	};

	Engine.getValidMovesForBlack = function()
	{
		this.determineValidMoves(false);
		return this.validBlackMoves;
	};

	Engine.getValidMovesFor = function(forWhite)
	{
		this.determineValidMoves(forWhite);
		if(forWhite)
			return this.validWhiteMoves;
		else
			return this.validBlackMoves;
	};

	Engine.determineValidMoves = function(forWhite)
	{
		// already done this?
		if((forWhite && this.validWhiteMoves.length > 0)
			|| (!forWhite && this.validBlackMoves.length > 0))
			return;

		if(forWhite)
			this.validWhiteMoves = [];

		if(!forWhite)
			this.validBlackMoves = [];

		var curr, move;
		var isWhite;
		var moves;

		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.hasPiece(f,r))
					continue;

				curr = FileMap.name(f,r);
				isWhite = PieceMap.isWhite(this.board.getPiece(f, r));

				if(isWhite != forWhite)
					continue;

				moves = this.getValidMovesForSquare(f,r);
				for(var i = 0; i < moves.length; i++)
				{
					move = '' + curr + moves[i];
					if(isWhite)
						this.validWhiteMoves.push(move);
					else
						this.validBlackMoves.push(move);
				}
			}
		}
	};

	Engine.getValidMovesForSquare = function(file, rank)
	{
		var result = [];

		if(!this.board.hasPiece(file, rank))
			return result;

		var piece = this.board.getPiece(file, rank);
		var isWhite = PieceMap.isWhite(piece);
		var isKing = (piece == 'k' || piece == 'K')?true:false;
		var isPawn = (piece == 'p' || piece == 'P')?true:false;
		var squareName = FileMap.name(file, rank);

		var currFEN = this.getPositionFEN();
		var postMoveEngine = EngineFactory.create();
		var possibles = this.board.getCoveredSquares(file, rank);

		if(possibles.length == 0)
			return result;

		var possibleFile, possibleRank, possibleHasPiece, possiblePiece;
		for(var i = 0; i < possibles.length; i++)
		{
			possibleFile = FileMap[possibles[i].substr(0,1)];
			possibleRank = possibles[i].substr(1,1);
			possibleHasPiece = this.board.hasPiece(possibleFile, possibleRank);
			possiblePiece = this.board.getPiece(possibleFile, possibleRank);

			// can't move to where our own pieces are
			if(possibleHasPiece
				&& PieceMap.isWhite(possiblePiece) == isWhite)
				continue;

			// pawn can only move to a covered if an opposing piece is there
			if(isPawn)
			{
				if(!possibleHasPiece)
					continue;
			}

			// can't make any move if it would cause check
			postMoveEngine.setFromBoard(this.board);
			var notation = '' + squareName + possibles[i];
			postMoveEngine.move(notation, true);
			if((isWhite && postMoveEngine.whiteInCheck())
				|| (!isWhite && postMoveEngine.blackInCheck()))
				continue;

			// attack with promotion!
			if(isPawn)
			{
				if(isWhite && possibleRank == 8)
				{
					result.push(possibles[i] + 'Q');
					result.push(possibles[i] + 'R');
					result.push(possibles[i] + 'B');
					result.push(possibles[i] + 'N');
				}
				else if(!isWhite && possibleRank == 1)
				{
					result.push(possibles[i] + 'q');
					result.push(possibles[i] + 'r');
					result.push(possibles[i] + 'b');
					result.push(possibles[i] + 'n');
				}
				else
				{
					result.push(possibles[i]);
				}
			}
			else
			{
				result.push(possibles[i]);
			}
		}

		// for pawns, we may also be able to move directly ahead...
		// just not if there are pieces there.
		if(isPawn)
		{
			if(isWhite)
			{
				if(	rank < 8 &&
					!this.board.hasPiece(file,rank + 1))
				{
					// still have to make sure wouldn't cause check.
					postMoveEngine.setFromBoard(this.board);
					var notation = '' + squareName 
						+ FileMap.name(file, rank + 1);
					postMoveEngine.move(notation, true);

					if(!postMoveEngine.whiteInCheck())
					{
						if(rank < 7)
							result.push(FileMap.name(file, rank + 1));
						else
						{
							// promotion options
							var baseName = FileMap.name(file, rank + 1);
							result.push(baseName + 'Q');
							result.push(baseName + 'R');
							result.push(baseName + 'N');
							result.push(baseName + 'B');
						}
					}

					if( rank == 2 &&
						!this.board.hasPiece(file,rank + 2))
					{
						postMoveEngine.setFromBoard(this.board);
						var notation = '' + squareName 
							+ FileMap.name(file, rank + 2);
						postMoveEngine.move(notation, true);

						if(!postMoveEngine.whiteInCheck())
							result.push(FileMap.name(file, rank + 2));
					}
				}
			}
			else
			{
				if(	rank > 1 &&
					!this.board.hasPiece(file, rank - 1))
				{
					// still have to make sure wouldn't cause check.
					postMoveEngine.setFromBoard(this.board);
					var notation = '' + squareName 
						+ FileMap.name(file, rank - 1);
					postMoveEngine.move(notation, true);

					if(!postMoveEngine.blackInCheck())
					{
						if(rank > 2)
							result.push(FileMap.name(file, rank - 1));
						else
						{
							// promotion options
							var baseName = FileMap.name(file, rank - 1);
							result.push(baseName + 'q');
							result.push(baseName + 'r');
							result.push(baseName + 'n');
							result.push(baseName + 'b');
						}					
					}

					if( rank == 7 &&
						!this.board.hasPiece(file, rank - 2))
					{
						postMoveEngine.setFromBoard(this.board);
						var notation = '' + squareName 
							+ FileMap.name(file, rank - 2);
						postMoveEngine.move(notation, true);

						if(!postMoveEngine.blackInCheck())
							result.push(FileMap.name(file, rank - 2));
					}
				}
			}
		}

		// might be able to castle
		if(isKing)
		{
			if(isWhite
				&& !this.whiteInCheck()
				&& rank == 1)
			{
				if(this.board.castlingOptions.indexOf('K') >= 0
					&& !this.board.hasPiece(file + 1,rank)
					&& !this.isSquareAttackedByBlack(file + 1, rank)
					&& !this.board.hasPiece(file + 2, rank)
					&& !this.isSquareAttackedByBlack(file + 2, rank)
					)
				{
					result.push(FileMap.name(file + 2, rank));
				}
				
				if(this.board.castlingOptions.indexOf('Q') >= 0
					&& !this.board.hasPiece(file - 1, rank)
					&& !this.isSquareAttackedByBlack(file - 1, rank)
					&& !this.board.hasPiece(file - 2, rank)
					&& !this.isSquareAttackedByBlack(file - 2, rank)
					)
				{
					result.push(FileMap.name(file - 2, rank));
				}
			}
			else if(!isWhite
				&& !this.blackInCheck()
				&& rank == 8)
			{
				if(this.board.castlingOptions.indexOf('k') >= 0
					&& !this.board.hasPiece(file + 1, rank)
					&& !this.isSquareAttackedByWhite(file + 1, rank)
					&& !this.board.hasPiece(file + 2, rank)
					&& !this.isSquareAttackedByWhite(file + 2, rank)
					)
				{
					result.push(FileMap.name(file + 2, rank));
				}

				if(this.board.castlingOptions.indexOf('q') >= 0
					&& !this.board.hasPiece(file - 1, rank)
					&& !this.isSquareAttackedByWhite(file - 1, rank)
					&& !this.board.hasPiece(file - 2, rank)
					&& !this.isSquareAttackedByWhite(file - 2, rank)
					)
				{
					result.push(FileMap.name(file - 2, rank));
				}
			}
		}

		return result;
	};

	// doesnt do a full check; just enough so the display 
	// knows to show promotion options
	Engine.isPromotionPossible = function(move)
	{
		var start = FileMap.coords(move.substr(0,2));

		if(this.board.hasPiece(start.file, start.rank))
		{
			var piece = this.board.getPiece(start.file, start.rank);
			if((piece == 'p' && start.rank == 2)
				|| (piece == 'P' && start.rank == 7))
				return true; 
		}

		return false;
	}

	// expecting square objects for start & end
	// or a "move" notation
	Engine.isValidMove = function(startOrMove, end)
	{
		var start;
		var endName;
		if(typeof startOrMove == 'object')
			start = startOrMove;
		else
			start = FileMap.coords(startOrMove.substr(0,2));

		if(typeof end == 'object')	
			endName = FileMap.name(end.file, end.rank);
		else
			endName = startOrMove.substr(2,3);

		// no piece?
		if(!this.board.hasPiece(start.file, start.rank))
			return false;

		// not your turn?
		if(PieceMap.getColor(this.board.getPiece(start.file, start.rank)) 
			!= this.board.getColorToMove())
		{
			//console.log('not your turn!');
			return false;
		}

		var valids = this.getValidMovesForSquare(start.file, start.rank);
		//console.log(endName);
		//console.log(valids);
		for(var i = 0; i < valids.length; i++)
		{
			if(valids[i] === endName)
				return true;
		};

		return false;
	};

	Engine.determineCoveredSquares = function(forWhite)
	{
		// already figured this out?
		if( (forWhite && this.whiteCoveredSquares.length > 0 )
			|| (!forWhite && this.blackCoveredSquares.legnth > 0 ))
			return;

		if(forWhite)
			this.whiteCoveredSquares = [];
	
		if(!forWhite)
			this.blackCoveredSquares = [];

		// loop all the squares, finding the ones with pieces
		// for each piece, determine coverage
		var covered;
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.hasPiece(f, r))
					continue;
	
				var isWhite = PieceMap.isWhite(this.board.getPiece(f, r));

				if(isWhite != forWhite)
					continue;

				covered = this.board.getCoveredSquares(f,r);

				// push onto the appropriate color array
				var arr = this.blackCoveredSquares;
				if(isWhite)
					arr = this.whiteCoveredSquares;

				for(var i = 0; i < covered.length; i++)
					arr.push(covered[i]);
			}
		}
	};

	Engine.findPiece = function(piece)
	{
		var found = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.hasPiece(f, r))
					continue;

				if(this.board.getPiece(f, r) == piece)
					found.push({ file: f, rank: r });
			}
		}
		return found;
	};

	Engine.isSquareAttacked = function(file, rank)
	{
		if(!this.board.hasPiece(file, rank))
			return false;

		var squareName = FileMap.name(file, rank);
		var covers;
		if(PieceMap.isWhite(this.board.getPiece(file, rank)))
			covers = this.getBlacksCoveredSquares();
		else
			covers = this.getWhitesCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] == squareName)
				return true;
		}

		return false;
	};

	Engine.isSquareAttackedByWhite = function(file, rank)
	{
		var squareName = FileMap.name(file, rank);
		var covers = this.getWhitesCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] == squareName)
				return true;
		}

		return false;
	};

	Engine.isSquareAttackedByBlack = function(file, rank)
	{
		var squareName = FileMap.name(file, rank);
		var covers = this.getBlacksCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] == squareName)
				return true;
		}

		return false;
	};

	Engine.getPositionFEN = function()
	{
		if(this.cachedPositionFEN)
			return this.cachedPositionFEN;

		var ranks = [];
		for(var r = 8; r > 0; r--)
		{
			var currRank = '';
			var empty = 0;
			for(var f = 1; f < 9; f++)
			{
				if(!this.board.hasPiece(f, r))
				{
					empty++;
					continue;
				}

				if(empty > 0)
				{
					currRank += empty;
					empty = 0;
				}

				currRank += this.board.getPiece(f, r);
			}
			
			if(empty > 0)
			{
				currRank += empty;
				empty = 0;
			}

			ranks.push(currRank);
		}

		this.cachedPositionFEN = ranks.join('/');
		return this.cachedPositionFEN;
	};

	Engine.setFEN = function(fen)
	{
		this.resetCaches();
		this.board.setFEN(fen);
	};

	Engine.setFromBoard = function(board)
	{
		this.resetCaches();
		this.board.copyFrom(board);
	};

	Engine.inStalemate = function(white)
	{
		if(this.inCheck(white))
			return false;

		return (this.getValidMovesFor(white).length == 0?true:false);
	};

	Engine.inCheck = function(white)
	{
		var king = this.findPiece((white?'K':'k'));
		if(king.length == 0)
			throw new Error('Invalid position; missing king');

		return this.isSquareAttacked(king[0].file, king[0].rank);
	};

	Engine.blackInCheck = function()
	{
		return this.inCheck(false);
	};

	Engine.whiteInCheck = function()
	{
		return this.inCheck(true);
	};

	Engine.inCheckmate = function(white)
	{
		if(!this.inCheck(white))
			return false;

		return (this.getValidMovesFor(white).length == 0?true:false);
	};

	Engine.blackInCheckmate = function()
	{
		return this.inCheckmate(false);
	};

	Engine.whiteInCheckmate = function()
	{
		return this.inCheckmate(true);
	};

	Engine.moves = function(moves)
	{
		if(typeof moves == 'string')
			moves = moves.split(' ');

		for(var i = 0; i < moves.length; i++)
		{
			if(!this.move(moves[i]))
				return false;
		}

		return true;
	};

	// expected: long algegraic; i.e. "e2e4"
	// returns boolean if move was executed successfully
	Engine.move = function(notation, skipValidCheck)
	{
		if(!notation)
			throw new Error('Missing move! Remember that getBestMove is non-blocking!');
		var skipValidCheck = skipValidCheck === true?true:false;
		var start = FileMap.coords(notation.substr(0,2));
		var end = FileMap.coords(notation.substr(2,2));
		// if there's anything left, it's a promotion
		var promotion = null;
		if(notation.length > 4)
			promotion = notation.substr(4,1);

		// can only move if we have something to move!
		if(!this.board.hasPiece(start.file, start.rank))
		{
			//console.log('no piece found');
			return false;
		}

		// valid move?
		// not clear we should be checking this here...
		// like maybe should have been done before hand?
		if(	!skipValidCheck &&
			!this.isValidMove(notation))
		{
			// exception?
			//console.log('invalid move ' + notation);
			return false;
		}

		// actually move the piece
		var piece = this.board.getPiece(start.file, start.rank);
		this.board.removePiece(start.file, start.rank);
		this.board.setPiece(piece, end.file, end.rank);

		// castling? need to find and move the rook too.
		var isKing = (piece == 'k' || piece == 'K')?true:false;
		if(isKing && Math.abs(start.file - end.file) == 2)
		{
			var rookSquare;
			var targetSquare;
			if(end.file > start.file)
			{
				rookSquare = { file: end.file + 1, rank: end.rank };
				targetSquare = { file: end.file - 1, rank: end.rank };
			}
			else
			{
				rookSquare = { file: end.file -2, rank: end.rank };
				targetSquare = { file: end.file + 1, rank: end.rank };
			}
			var rook = this.board.getPiece(rookSquare.file, rookSquare.rank);
			if(!rook)
			{
				// this shouldn't happen; if it does,
				// there is something wrong with the valid move generator.
				console.log(start);
				console.log(end);
				console.log(rookSquare);
				this.board.dump();
			}

			this.board.removePiece(rookSquare.file, rookSquare.rank);
			this.board.setPiece(rook, targetSquare.file, targetSquare.rank);
		
			if(PieceMap.isWhite(rook))
			{
				this.board.castlingOptions = this.board.castlingOptions.replace(/[KQ]/g, '');
			}
			else
			{
				this.board.castlingOptions = this.board.castlingOptions.replace(/[kq]/g, '');
			}

			if(this.board.castlingOptions == '')
				this.board.castlingOptions = '-';
		}
		// moving the king removes castling options 
		else if(isKing)
		{
			if(PieceMap.isWhite(piece))
			{
				this.board.castlingOptions = this.board.castlingOptions.replace(/[KQ]/g, '');
			}
			else
			{
				this.board.castlingOptions = this.board.castlingOptions.replace(/[kq]/g, '');
			}
		}

		// moving a rook removes castling options that side
		if(piece == 'r')
		{
			if(start.file == 1)
				this.board.castlingOptions = this.board.castlingOptions.replace('q', '');
			else if(start.file == 8)
				this.board.castlingOptions = this.board.castlingOptions.replace('k', '');
		}
		else if(piece == 'R')
		{
			if(start.file == 1)
				this.board.castlingOptions = this.board.castlingOptions.replace('Q', '');
			else if(start.file == 8)
				this.board.castlingOptions = this.board.castlingOptions.replace('K', '');

		}

		// promoting?
		if(promotion)
		{
			//console.log('promote? ' + promotion);
			this.board.setPiece(promotion, end.file, end.rank);
		}

		// update move number/color
		this.board.incrementMove();

		// our caches are no longer valid
		this.resetCaches();

		return true;
	};

	Engine.getWhiteStaticValue = function()
	{
		this.determineStaticValues();
		return this.whiteStaticValue;
		
	};

	Engine.getBlackStaticValue = function()
	{
		this.determineStaticValues();
		return this.blackStaticValue;
	};

	Engine.determineStaticValues = function()
	{
		// already done this?
		if(this.whiteStaticValue > 0
			|| this.blackStaticValue > 0)
			return;

		this.whiteStaticValue = 0;
		this.blackStaticValue = 0;
		var curr;

		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.hasPiece(f, r))
					continue;

				// values based on Kaufman's seminal 1999 article
				//@see http://home.comcast.net/~danheisman/Articles/evaluation_of_material_imbalance.htm
				switch(this.board.getPiece(f, r))
				{
					case 'Q':
					case 'q':
						curr = 9.75;
					break;
					case 'R':
					case 'r':
						curr = 5;
					break;
					case 'B':
					case 'b':
						curr = 3.25;
					break;
					case 'N':
					case 'n':
						curr = 3.25;
					break;
					case 'P':
					case 'p':
						curr = 1;
					break;
					default:
						continue;
				}

				// give us more room for dynamic values
				curr *= 10;

				if(PieceMap.isWhite(this.board.getPiece(f, r)))
					this.whiteStaticValue += curr;
				else
					this.blackStaticValue += curr;
			}
		}
	};

	Engine.getWhiteDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.whiteDynamicValue;
	};

	Engine.getBlackDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.blackDynamicValue;
	};

	// based on position
	Engine.determineDynamicValues = function()
	{
		// already done this?
		if(this.whiteDynamicValue > 0
			|| this.blackDynamicValue > 0)
			return;

		this.whiteDynamicValue = 0;
		this.blackDynamicValue = 0;

		// do we have both bishops?
		// worth a 1/2 pawn
		if(this.findPiece('b').length >= 2)
			this.blackDynamicValue += 5;

		if(this.findPiece('B').length >= 2)
			this.whiteDynamicValue += 5;

		// how much space to our pieces have?
		var divisor = 2;
		var covers = this.getBlacksCoveredSquares();
		this.blackDynamicValue += Math.round(covers.length / divisor);

		var covers = this.getWhitesCoveredSquares();
		this.whiteDynamicValue += Math.round(covers.length / divisor);
	};

	Engine.getBestMoveForWhite = function()
	{
		return this.getBestMove(true);
	};
	
	Engine.getBestMoveForBlack = function()
	{
		return this.getBestMove(false);
	};

	Engine.evaluateMove = function(notation)
	{
		var board = this.clone();
		board.move(notation);
		return board.evaluatePosition();
	};

	Engine.clone = function()
	{
		var board = EngineFactory.create();
		board.setFromBoard(this.board);

		return board;
	};
	
	var abExamined;
	var fenEvals;
	Engine.getBestMove = function(forWhite, callback)
	{
		this.lastBestMove = '';
		this.lastValue = 0;
		abExamined = 0;
		fenEvals = {};
		var start = new Date().getTime();
		var that = this;
		var finish = function()
		{
			var end = new Date().getTime();
			var diff = (end - start) / 1000;
			//this.board.dump();
			console.log(
				(forWhite?'white':'black') + ' to move'
				+'; examined: ' + abExamined 
				+ ' nodes in ' + diff + 's '
				+ '(' + Math.round(abExamined / diff) + 'n/s)'
				+ '; best: ' + that.lastBestMove
				+ ' (' + that.lastValue + ')');

			if(typeof callback === 'function')
				callback(that.lastBestMove);
		};

		// old way
		if(true)
		{
			this.alphabetaOld(this.searchPly, -10000, 10000, forWhite);
			finish();
		}
		else
		{
			this.organizeAndSearch(forWhite, finish);
		}
	};


	// split up our work so we can potentially choose from 
	// a few different reasonable lines
	// and maybe parallelize a bit 
	Engine.organizeAndSearch = function(forWhite, callback)
	{
		var moves = this.getValidMovesFor(forWhite);
		// if there are no moves, it's either checkmate or stalemate.
		var numMoves = moves.length;
		if(numMoves == 0)
		{
			this.lastValue = this.evaluatePosition();
			callback();
			return;
		}

		this.moveOptions = [];

		// first, loop and look for mates, then checks
		var cloned = this.clone();
		for(var i = 0; i < numMoves; i++)
		{
			abExamined++;
			cloned.setFromBoard(this.board);
			cloned.move(moves[i]);

			var value = 
			{
				move: moves[i],
				win: cloned.inCheckmate(!forWhite),
				check: cloned.inCheck(!forWhite),
				value: cloned.evaluatePosition()
			}

			this.moveOptions.push(value);
		}

		// now sort it
		// (remember; < 0 sorts higher)
		this.moveOptions.sort(function(a, b)
		{
			if(a.win)
			{
				if(b.win)
					return 0;
				else
					return -1;
			}

			if(b.win)
				return 1;

			if(a.check)
			{
				if(b.check)
					return 0;
				else
					return -1;
			}

			if(b.check)
				return 1;

			return (b.value - a.value);
		});

		//console.log(this.moveOptions);
		// if we have a win, we don't have to go any further
		if(this.moveOptions[0].win)
		{
			this.lastBestMove = this.moveOptions[0].move;
			this.lastValue = this.moveOptions[0].value;
			callback();
			return;
		}

		// otherwise, we divide and conquer.
		var that = this;
		that.threadCount = numMoves;
		var startEval = function(idx)
		{
			//console.log(' starting ' + that.moveOptions[idx].move);
			var cloned = that.clone();
			cloned.move(that.moveOptions[idx].move);
			cloned.alphabeta(that.searchPly - 1, -10000, 10000, !forWhite);
			that.moveOptions[idx].value = cloned.lastValue;
			//console.log('done with ' + that.moveOptions[idx].move + '; ' + cloned.lastValue);
			that.threadCount--;

			if(that.threadCount == 0)
			{
				that.moveOptions.sort(function(a,b)
				{
					return (b.value - a.value);
				});

				// which end? 
				var wanted;
				if(forWhite)
					wanted = 0;
				else
					wanted = numMoves - 1;

				that.lastBestMove = that.moveOptions[wanted].move;
				that.lastValue = that.moveOptions[wanted].value;
				callback();
			}
		};

		console.log('there are ' + numMoves + ' initial moves to evaluate.');
		for(var i = 0; i < numMoves; i++)
		{
			(function(idx)
			{
				setTimeout(function()
				{
					startEval(idx);
				},0);
			})(i);
		}
	};

	Engine.alphabeta = function(depth, a, b, wantsMax)
	{
		abExamined++;

		var moves = this.getValidMovesFor(wantsMax);
		// if there are no moves, it's either checkmate or stalemate.
		var numMoves = moves.length;
		if(numMoves == 0)
		{
			//console.log('[no moves]');
			return this.evaluatePosition();
		}

		//console.log(moves);
		//console.log(depth + ' before move loop, a: ' + a + ', b: ' + b);
		var val;
		var cloned = this.clone();
		for(var i = 0; i < numMoves; i++)
		{
			cloned.setFromBoard(this.board);
			cloned.move(moves[i]);

			//console.log(depth + ' examining ' + moves[i] + ' (want ' + (wantsMax?'max':'min') + ')');

			// before we go deep, look for checkmate.
			if(cloned.inCheckmate(!wantsMax))
			{
				//console.log('checkmate');
				this.lastBestMove = moves[i];
				this.lastValue = cloned.evaluatePosition();
				if(wantsMax)
					a = this.lastValue;
				else
					b = this.lastValue;
				break;
			}

			if(depth == 0)
			{
				// for comparison with old
				abExamined++;
				val = cloned.evaluatePosition();
			}
			else
				val = cloned.alphabeta(depth - 1, a, b, !wantsMax);
			//console.log('result of ' + moves[i] + ': ' + val);
			if(wantsMax)
			{
				if(a < val)
				{
					a = val;
					this.lastBestMove = moves[i];
					this.lastValue = val;
				}
			}
			else
			{
				if(b > val)
				{
					b = val;
					this.lastBestMove = moves[i];
					this.lastValue = val;
				}
			}

			// no point in continuing; prune
			if(b <= a)
			{
				//console.log('prune');
				break;
			}
		}
		//console.log(depth + ' after move loop: ' + this.lastBestMove + ', a: ' + a + ', b: ' + b);
		var ret;
		if(wantsMax)
			ret = a;
		else
			ret = b;

		//console.log('returning ' + (wantsMax?'max ':'min ') + ret + ' (' + this.lastBestMove + ')');
		return ret;
	};



	Engine.alphabetaOld = function(depth, a, b, isWhite)
	{
		abExamined++;
		var val;

		// we only actually evaluate the position once we've hit bottom.
		if(depth == 0)
			return this.evaluatePosition();

		var board = this.clone();
		var moves;
		var curr;
		if(isWhite)
		{
			moves = this.getValidMovesForWhite();

			// what if we have no valid moves?

			for(var i = 0; i < moves.length; i++)
			{
				//console.log(depth + ' (w) ' + moves[i]);
				// reset the board
				board.setFromBoard(this.board);

				// make the move
				board.move(moves[i]);
				//board.board.dump();

				if(board.blackInCheckmate())
				{
					//console.log('black checkmated');
					a = 1000;
					this.lastBestMove = moves[i];
					this.lastValue = a;
					break;
				}

				val = board.alphabetaOld(depth - 1, a, b, !isWhite);

				if(a < val)
				{
					a = val;
					this.lastBestMove = moves[i];
					this.lastValue = val;
				}

				if(b <= a)
				{
					//console.log('prune');
					break;
				}
			}
			return a;
		}
		else
		{
			moves = this.getValidMovesForBlack();

			// what if we have no valid moves?

			for(var i = 0; i < moves.length; i++)
			{
				//console.log(depth + ' (b) ' + moves[i]);
				// reset the board
				board.setFromBoard(this.board);

				// make the move
				board.move(moves[i]);
				if(depth == 5)
					board.board.dump();

				if(board.whiteInCheckmate())
				{
					//console.log('white checkmated');
					b = -1000;
					this.lastBestMove = moves[i];
					this.lastValue = b;
					break;
				}

				val = board.alphabeta(depth - 1, a, b, !isWhite);

				if(b > val)
				{
					b = val;
					this.lastBestMove = moves[i];
					this.lastValue = b;
				}

				if(b <= a)
				{
					//console.log('prune');
					break;
				}
			}

			return b;
		}
	};

	Engine.evaluatePosition = function()
	{
		if(this.whiteInCheckmate())
			return -1000;
		else if(this.blackInCheckmate())
			return 1000;

		var value = 0;

		// this one is a little odd cuz it depends on whose turn it is
		var whiteToMove = (this.board.getColorToMove() == ColorMap.white?true:false);
		if(this.inStalemate(whiteToMove))
			return value;

		value += this.getWhiteStaticValue();
		value -= this.getBlackStaticValue();
		value += this.getWhiteDynamicValue();
		value -= this.getBlackDynamicValue();
	
		/*
		console.log(notation + ': ' + value);
		console.log(this.getWhiteStaticValue() + ',' +
					this.getBlackStaticValue() + ',' +
					this.getWhiteDynamicValue() + ',' +
					this.getBlackDynamicValue());
		this.dump();
		*/
		return value;
	};

	// create a new engine
	EngineFactory = (function()
	{
		var that = {};
		
		that.create = function(board)
		{
			if(typeof board === 'undefined')
				board = BoardFactory.create();

			return Object.create(Engine).init(board);
		};

		return that;
	})();
// end scope wrapper
})();
