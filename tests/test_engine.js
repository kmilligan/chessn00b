// tests for our engine (and engine, by extension)
$.getScript('../src/board.js', function()
{
	$.getScript('../src/engine.js', function()
	{
		test("CreateBoard", testCreateBoard);
		test("FEN", testFEN);
		test("SimpleCoverage", testSimpleCoverage);
		test("LessSimpleCoverage", testLessSimpleCoverage);
		test("SimpleValidMoves", testSimpleValidMoves);
		test("ComplexValidMoves", testComplexValidMoves);
		test("FindPiece", testFindPiece);
		test("SquareAttacked", testIsSquareAttacked);
		test("InCheck", testInCheck);
		test("InCheckmate", testInCheckmate);
		test("StaticPieceValue", testStaticPieceValue);
		test("DynamicPieceValue", testDynamicPieceValue);
		test("SimpleMove", testSimpleMove);
		test("SimpleBestMove", testSimpleBestMove);
		test("2PlyBestMove", test2PlyBestMove);
		//test("Timing", testTiming);
	});
});

var testCreateBoard = function()
{
	var board = BoardFactory.create();

	// a8, h1 are white
	ok(board.getSquare(1,8).isWhite());
	ok(board.getSquare(8,1).isWhite());

	// a1, h8 are black
	ok(!board.getSquare(1,1).isWhite());
	ok(!board.getSquare(8,8).isWhite());

	// try using algebraic
	ok(board.getSquare('a8').isWhite());
	ok(board.getSquare('h1').isWhite());
	ok(!board.getSquare('a1').isWhite());
	ok(!board.getSquare('h8').isWhite());
};

var testFEN = function()
{
	var engine = EngineFactory.create();
	
	// standard starting engine
	var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	
	engine.setFEN(fen);
	equal(engine.board.getSquare(4,1).getPiece(), 'Q');
	equal(engine.board.getSquare(4,8).getPiece(), 'q');
	ok(engine.board.isWhiteToMove());

	equal(engine.getPositionFEN(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
};

var testSimpleCoverage = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('k7/8/8/8/8/8/1K6/8 w - 0 1');	
	equal(engine.board.getSquare(1,8).getPiece(), 'k');
	equal(engine.board.getSquare(2,2).getPiece(), 'K');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 8);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 3);
	
	engine.setFEN('q7/8/8/8/8/8/1Q6/8 w - 0 1');	
	equal(engine.board.getSquare(1,8).getPiece(), 'q');
	equal(engine.board.getSquare(2,2).getPiece(), 'Q');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 23);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 21);

	engine.setFEN('r7/8/8/8/8/8/1R6/8 w - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 14);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 14);

	engine.setFEN('b7/8/8/8/8/8/1B6/8 w - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 7);

	engine.setFEN('n7/8/8/8/8/8/1N6/8 w - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 2);
	
	engine.setFEN('p7/8/8/8/8/8/1P6/8 w - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 2);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 1);
};

var testLessSimpleCoverage = function()
{
	// king coverage shouldn't change, but others should add
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	equal(engine.board.getSquare(1,8).getPiece(), 'k');
	equal(engine.board.getSquare(2,2).getPiece(), 'K');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 5);

	// Queens are now blocked, reducing scope
	engine.setFEN('qp6/8/8/8/8/1P6/1QP5/8 w - 0 1');	
	equal(engine.board.getSquare(1,8).getPiece(), 'q');
	equal(engine.board.getSquare(2,2).getPiece(), 'Q');

	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 17);

	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 17);

	// knights remain unaffected
	engine.setFEN('n7/8/1r6/8/8/8/1N6/8 w - 0 1');	
	var coverageWhite = engine.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = engine.getBlacksCoveredSquares();
	equal(coverageBlack.length, 15);
};

var testSimpleValidMoves = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/r7/PK6/8 w - 0 1');	
	equal(engine.board.getSquare(1,8).getPiece(), 'k');
	equal(engine.board.getSquare(2,2).getPiece(), 'K');

	equal(engine.getValidMovesForSquare(1,8).length, 2);

	// king can't move into check! but can take the rook...
	ok(engine.isSquareAttackedByBlack(engine.board.getSquare(2,3)));
	equal(engine.getValidMovesForSquare(2,2).length, 5);

	// ...unless it's protected
	engine.setFEN('kp6/8/8/8/1p6/r7/PK6/8 w - 0 1');	
	equal(engine.getValidMovesForSquare(2,2).length, 4);
};

var testComplexValidMoves = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('8/8/8/8/8/1P6/P7/8 w - 0 1');	

	// pawns can move two on first move!
	equal(engine.getValidMovesForSquare(2,3).length, 1);
	equal(engine.getValidMovesForSquare(1,2).length, 2);

	// piece can't move if it would put king in check!
	engine.setFEN('8/8/8/8/p7/1r6/1Q6/1K6 w - 0 1');
	// ...but can still take rook, even tho protected!
	equal(engine.getValidMovesForSquare(2,2).length, 1);
};

var testFindPiece = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	

	equal(engine.findPiece('K')[0].getPiece(), 'K');
	equal(engine.findPiece('k')[0].getPiece(), 'k');
};

var testIsSquareAttacked = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!engine.isSquareAttacked(engine.findPiece('K')[0]));
	ok(!engine.isSquareAttacked(engine.findPiece('k')[0]));

	// black king protected, white not
	engine.setFEN('kp5R/8/8/8/8/q7/PK6/8 w - 0 1');	
	//engine.dump();
	ok(engine.isSquareAttacked(engine.findPiece('K')[0]));
	ok(!engine.isSquareAttacked(engine.findPiece('k')[0]));

	// can't protect against the knight!
	engine.setFEN('kp6/2N5/8/8/1q6/1P6/PK6/8 w - 0 1');	
	ok(!engine.isSquareAttacked(engine.findPiece('K')[0]));
	ok(engine.isSquareAttacked(engine.findPiece('k')[0]));
};

var testInCheck = function()
{
	// have to take into account
	// a) being attacked
	// b) who has the move? shouldn't matter?

	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!engine.blackInCheck());	
	ok(!engine.whiteInCheck());	

	engine.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - 0 1');	
	ok(!engine.blackInCheck());	
	ok(engine.whiteInCheck());	
};

var testInCheckmate = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!engine.blackInCheckmate());	
	ok(!engine.whiteInCheckmate());	

	engine.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - 0 1');	
	ok(!engine.blackInCheckmate());	
	ok(!engine.whiteInCheckmate());	

	engine.setFEN('8/8/8/8/8/1k6/1q6/1K6 w - 0 1');	
	ok(engine.whiteInCheckmate());	

	// this one is trickier because a1 is not *currently* covered
	// but *would be* if the King wanted to go there.
	engine.setFEN('8/8/8/8/1k6/2q5/PK6/1R6 w - 0 1');	
	equal(engine.getValidMovesForSquare(2,2).length, 0);
	ok(engine.whiteInCheckmate());	
};

var testStaticPieceValue = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('rnbqk3/8/8/8/8/8/PPPPP3/RNBQK3 w - 0 1');	
	equal(engine.getWhiteStaticValue(), 250);	
	equal(engine.getBlackStaticValue(), 200);	
};

var testDynamicPieceValue = function()
{
	var engine = EngineFactory.create();
	engine.setFEN('2b1kb2/8/8/8/8/8/8/3QK3 w - 0 1');	
	equal(engine.getWhiteDynamicValue(), 23);	
	equal(engine.getBlackDynamicValue(), 29);	
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
	var engine = EngineFactory.create();
	engine.setFEN('5q2/6r1/8/8/8/8/7K/8 b - 0 1');
	equal(engine.getBestMoveForBlack(), 'f8h8');

	engine.setFEN('q7/5p2/6R1/8/8/8/8/8 b - 0 1');
	equal(engine.getBestMoveForBlack(), 'f7g6');
	
	engine.setFEN('8/6p1/q5R1/8/8/8/8/8 w - 0 1');
	equal(engine.getBestMoveForWhite(), 'g6a6');
};

var test2PlyBestMove = function()
{
	var engine = EngineFactory.create();
	// have a choice...take the queen (and lose next turn)
	// or take the bishop
	engine.setFEN('8/p7/1q/1R5b/8/8/8/8 w - 0 1');
	equal(engine.getBestMoveForWhite(), 'b5h5');
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
