// tests for our engine (and engine, by extension)
//$.getScript('../src/board.js', function()
$.getScript('../src/board_10x12.js', function()
{
	$.getScript('../src/engine.js', function()
	{
		test("CreateBoard", testCreateBoard);
		test("FEN", testFEN);
		test("SimpleCoverage", testSimpleCoverage);
		test("LessSimpleCoverage", testLessSimpleCoverage);
		test("SimpleValidMoves", testSimpleValidMoves);
		test("ComplexValidMoves", testComplexValidMoves);
		test("Castling", testCastling);
		test("PawnPromotion", testPawnPromotion);
		test("FindPiece", testFindPiece);
		test("SquareAttacked", testIsSquareAttacked);
		test("InCheck", testInCheck);
		test("InCheckmate", testInCheckmate);
		test("StaticPieceValue", testStaticPieceValue);
		test("DynamicPieceValue", testDynamicPieceValue);
		test("SimpleMove", testSimpleMove);
		test("SimpleBestMove", testSimpleBestMove);
		test("SimpleBestMove2", testSimpleBestMove2);
		test("2PlyBestMove", test2PlyBestMove);
		test("Stalemate", testStalemate);
		//test("Timing", testTiming);
	});
});

var testCreateBoard = function()
{
	var board = BoardFactory.create();
	var colorMap = BoardFactory.getColorMap();
	
	// a8, h1 are white
	equal(board.getSquareColor(1,8), colorMap.white);
	equal(board.getSquareColor(8,1), colorMap.white);

	// a1, h8 are black
	equal(board.getSquareColor(1,1), colorMap.black);
	equal(board.getSquareColor(8,8), colorMap.black);

	// try using algebraic
	equal(board.getSquareColor('a8'), colorMap.white);
	equal(board.getSquareColor('h1'), colorMap.white);
	equal(board.getSquareColor('a1'), colorMap.black);
	equal(board.getSquareColor('h8'), colorMap.black);
};

var testFEN = function()
{
	var engine = EngineFactory.create();
	
	// standard starting engine
	var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	
	engine.setFEN(fen);
	equal(engine.board.getPiece(4,1), 'Q');
	equal(engine.board.getPiece(4,8), 'q');
	equal(engine.board.getColorToMove(), BoardFactory.getColorMap().white);

	equal(engine.getPositionFEN(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
};

var testSimpleCoverage = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('k7/8/8/8/8/8/1K6/8 w - 0 1');	
	equal(engine.board.getPiece(1,8), 'k');
	equal(engine.board.getPiece(2,2), 'K');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 8);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 3);
	
	engine.setFEN('q7/8/8/8/8/8/1Q6/8 w - 0 1');	
	equal(engine.board.getPiece(1,8), 'q');
	equal(engine.board.getPiece(2,2), 'Q');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 23);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 21);

	engine.setFEN('r7/8/8/8/8/8/1R6/8 w - - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 14);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 14);

	engine.setFEN('b7/8/8/8/8/8/1B6/8 w - - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 7);

	engine.setFEN('n7/8/8/8/8/8/1N6/8 w - - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 2);
	
	engine.setFEN('p7/8/8/8/8/8/1P6/8 w - - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 2);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 1);
};

var testLessSimpleCoverage = function()
{
	// king coverage shouldn't change, but others should add
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - - 0 1');	
	equal(engine.board.getPiece(1,8), 'k');
	equal(engine.board.getPiece(2,2), 'K');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 5);

	// Queens are now blocked, reducing scope
	engine.setFEN('qp6/8/8/8/8/1P6/1QP5/8 w - - 0 1');	
	equal(engine.board.getPiece(1,8), 'q');
	equal(engine.board.getPiece(2,2), 'Q');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 17);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 17);

	// knights remain unaffected
	engine.setFEN('n7/8/1r6/8/8/8/1N6/8 w - - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 15);
};

var testSimpleValidMoves = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/r7/PK6/8 w - - 0 1');	
	equal(engine.board.getPiece(1,8), 'k');
	equal(engine.board.getPiece(2,2), 'K');

	equal(engine.getValidMovesForSquare(1,8).length, 2);

	// king can't move into check! but can take the rook...
	ok(engine.isSquareAttackedByBlack(2,3));
	equal(engine.getValidMovesForSquare(2,2).length, 5);

	// ...unless it's protected
	engine.setFEN('kp6/8/8/8/1p6/r7/PK6/8 w - - 0 1');	
	equal(engine.getValidMovesForSquare(2,2).length, 4);
};

var testComplexValidMoves = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('3K1k2/8/8/8/8/1P6/P7/8 w - - 0 1');	

	// pawns can move two on first move!
	equal(engine.getValidMovesForSquare(2,3).length, 1);
	equal(engine.getValidMovesForSquare(1,2).length, 2);

	// piece can't move if it would put king in check!
	engine.setFEN('8/8/8/8/p7/1r6/1Q6/1K6 w - - 0 1');
	// ...but can still take rook, even tho protected!
	equal(engine.getValidMovesForSquare(2,2).length, 1);

	// other pieces can't move if king is already in check
	engine.setFEN('4k3/pppp1ppp/8/4Q3/8/8/8/K7 b - - 0 1');
	equal(engine.getValidMovesForBlack().length, 2);
};

var testFindPiece = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - - 0 1');	

	equal(engine.findPiece('K')[0].file, 2);
	equal(engine.findPiece('k')[0].rank, 8);
};

var testIsSquareAttacked = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - - 0 1');
	var whiteKing = engine.findPiece('K')[0];
	var blackKing = engine.findPiece('k')[0];
	ok(!engine.isSquareAttacked(whiteKing.file, whiteKing.rank));
	ok(!engine.isSquareAttacked(blackKing.file, blackKing.rank));

	// black king protected, white not
	engine.setFEN('kp5R/8/8/8/8/q7/PK6/8 w - - 0 1');	
	//engine.dump();
	var whiteKing = engine.findPiece('K')[0];
	var blackKing = engine.findPiece('k')[0];
	ok(engine.isSquareAttacked(whiteKing.file, whiteKing.rank));
	ok(!engine.isSquareAttacked(blackKing.file, blackKing.rank));

	// can't protect against the knight!
	engine.setFEN('kp6/2N5/8/8/1q6/1P6/PK6/8 w - - 0 1');	
	var whiteKing = engine.findPiece('K')[0];
	var blackKing = engine.findPiece('k')[0];
	ok(!engine.isSquareAttacked(whiteKing.file, whiteKing.rank));
	ok(engine.isSquareAttacked(blackKing.file, blackKing.rank));
};

var testInCheck = function()
{
	// have to take into account
	// a) being attacked
	// b) who has the move? shouldn't matter?

	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - - 0 1');	
	ok(!engine.blackInCheck());	
	ok(!engine.whiteInCheck());	

	engine.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - - 0 1');	
	ok(!engine.blackInCheck());	
	ok(engine.whiteInCheck());	
};

var testInCheckmate = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - - 0 1');	
	ok(!engine.blackInCheckmate());	
	ok(!engine.whiteInCheckmate());	

	engine.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - - 0 1');	
	ok(!engine.blackInCheckmate());	
	ok(!engine.whiteInCheckmate());	

	engine.setFEN('8/8/8/8/8/1k6/1q6/1K6 w - - 0 1');	
	ok(engine.whiteInCheckmate());	

	// this one is trickier because a1 is not *currently* covered
	// but *would be* if the King wanted to go there.
	engine.setFEN('8/8/8/8/1k6/2q5/PK6/1R6 w - - 0 1');	
	equal(engine.getValidMovesForSquare(2,2).length, 0);
	ok(engine.whiteInCheckmate());	

	// not checkmate because the attacker can be taken
	engine.setFEN('8/8/8/8/1k6/8/B4PPP/1r4K1 w - - 0 1');	
	equal(engine.getValidMovesForSquare(2,2).length, 0);
	equal(engine.getValidMovesForWhite().length, 1);
	ok(!engine.whiteInCheckmate());	
};

var testCastling = function()
{
	var engine = EngineFactory.create();
	// pretend we've already moved 
	// (or done something to make castling not an option)
	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1');
	equal(engine.getValidMovesForSquare(5,1).length, 5);

	// ...but now it is
	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
	equal(engine.getValidMovesForSquare(5,1).length, 7);
	
	// ...but now it's now cuz squares are covered
	engine.setFEN('r3k1r1/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
	equal(engine.getValidMovesForSquare(5,1).length, 6);

	// and if we move, the rook should too
	ok(engine.move('e1c1'));
	equal(engine.getPositionFEN(), 'r3k1r1/8/8/8/8/8/8/2KR3R');
	// ...and castling should no longer be an option
	equal(engine.board.castlingOptions, 'kq');

	// make short castling works too!
	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
	ok(engine.move('e1g1'));
	equal(engine.getPositionFEN(), 'r3k2r/8/8/8/8/8/8/R4RK1');

	// and for black!
	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
	ok(engine.move('e8g8'));
	equal(engine.getPositionFEN(), 'r4rk1/8/8/8/8/8/8/R3K2R');

	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
	ok(engine.move('e8c8'));
	equal(engine.getPositionFEN(), '2kr3r/8/8/8/8/8/8/R3K2R');

	// if we move (but not castle) the king or the rook,
	// castling should no longer be available
	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
	ok(engine.move('e8e7'));
	equal(engine.board.castlingOptions, 'KQ');

	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
	ok(engine.move('e1e2'));
	equal(engine.board.castlingOptions, 'kq');

	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
	ok(engine.move('h8h7'));
	equal(engine.board.castlingOptions, 'KQq');

	engine.setFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
	ok(engine.move('a1a2'));
	equal(engine.board.castlingOptions, 'Kkq');
};

var testPawnPromotion = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('r3k2r/6P1/8/8/8/8/8/R3K2R w - - 0 1');
	// can take the rook 4 ways,
	// or move straight and promote to one of 4 options
	equal(engine.getValidMovesForSquare(7,7).length, 8);
	ok(engine.move('g7g8Q'));
	equal(engine.getPositionFEN(), 'r3k1Qr/8/8/8/8/8/8/R3K2R');
	
	engine.setFEN('r3k2r/8/8/8/8/8/6p1/R3K2R b - - 0 1');
	equal(engine.getValidMovesForSquare(7,2).length, 8);
	ok(engine.move('g2g1q'));
	equal(engine.getPositionFEN(), 'r3k2r/8/8/8/8/8/8/R3K1qR');
};

var testStaticPieceValue = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('rnbqk3/8/8/8/8/8/PPPPP3/RNBQK3 w - - 0 1');	
	equal(engine.getWhiteStaticValue(), 262.5);	
	equal(engine.getBlackStaticValue(), 212.5);	
};

var testDynamicPieceValue = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('2b1kb2/8/8/8/8/8/8/3QK3 w - - 0 1');	
	equal(engine.getWhiteDynamicValue(), 12);	
	equal(engine.getBlackDynamicValue(), 15);	
};

var testSimpleMove = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
	ok(engine.move('e2e4'));
	equal(engine.getPositionFEN(), 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');

	engine.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
	ok(engine.moves('e2e4 c7c5 g1f3'));
	equal(engine.getPositionFEN(), 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R');
};

var testSimpleBestMove = function()
{
	stop();
	var engine = EngineFactory.create();
	engine.setFEN('7k/6p1/6P1/8/P7/5npp/8/7K b - - 0 1');
	//engine.board.dump();
	engine.getBestMove(false, function(move)
	{
		equal(move, 'g3g2');

		engine.setFEN('4kq2/6r1/8/8/8/8/7K/8 b - - 0 1');
		//engine.board.dump();
		engine.getBestMove(false, function(move)
		{
			equal(move, 'f8h8');

			engine.setFEN('q7/5p2/6R1/8/8/8/4PPPP/3k1K2 b - - 0 1');
			//engine.board.dump();
			engine.getBestMove(false, function(move)
			{
				equal(move, 'f7g6');
				start();
			});
		});
	});
};

var testSimpleBestMove2 = function()
{
	stop();
	var engine = EngineFactory.create();
	engine.setFEN('k7/6PR/8/8/8/8/8/7K w - - 0 1');
	engine.getBestMove(true, function(move)
	{
		equal(move, 'g7g8Q');

		engine.setFEN('k7/8/8/8/8/r7/5pPK/6BB b - - 0 1');
		engine.getBestMove(false, function(move)
		{
			equal(move, 'f2f1n');
			start();
		});
	});
};

var testSimpleBestMove3 = function()
{
	stop();
	var engine = EngineFactory.create();
	engine.setFEN('8/6p1/q5R1/8/8/8/8/2k1K3 w - - 0 1');
	//engine.board.dump();
	equal(engine.board.getColorToMove(), BoardFactory.getColorMap().white);
	engine.getBestMove(true, function(move)
	{
		equal(move, 'g6a6');

		engine.setFEN('6k1/6P1/6PB/6P1/2p3p1/n1r3pb/1P4p1/6K1 w - - 0 1');
		//engine.board.dump();
		engine.getBestMove(true, function(move)
		{
			equal(move, 'b2c3');
			start();
		});
	});
};

var test2PlyBestMove = function()
{
	stop();
	var engine = EngineFactory.create();
	// have a choice...take the queen (and lose next turn)
	// or take the en prise rook
	engine.setFEN('5nk1/p4ppp/1q/1R5r/8/8/5PPP/5NK1 w - - 0 1');
	//engine.board.dump();
	engine.getBestMove(true, function(move)
	{
		equal(move, 'b5h5');
		start();
	});
};

var testStalemate = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('6k1/6P1/6PB/6P1/8/8/8/6K1 b - - 0 1');
	equal(engine.inStalemate(false), true);
	equal(engine.inStalemate(true), false);

	equal(engine.evaluatePosition(), 0);
};

var testTiming = function()
{
	// let see how slow clone is.
	var engine = EngineFactory.create();
	var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	engine.setFEN(fen);

	var clone;
	var numCopies = 2000;
	var start = new Date().getTime();
	for(var i = 0; i < numCopies; i++)
		clone = engine.clone();

	var end = new Date().getTime();

	console.log((end - start) + 'ms makin ' + numCopies + ' copies');
	ok(true);

	// maybe it's determineValid?
	var start = new Date().getTime();
	for(var i = 0; i < numCopies; i++)
	{
		clone.determineValidMoves(true);
		clone.resetCaches();
	}

	var end = new Date().getTime();

	console.log((end - start) + 'ms makin ' + numCopies + ' determineValidMoves');
	ok(true);
};
