<?php
/**
 * Latest Comments block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Latest Comments block.
 *
 * @group blocks
 */
class Tests_Blocks_RenderBlockLatestComments extends WP_UnitTestCase {
	/**
	 * Post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Post author user ID.
	 *
	 * @var int
	 */
	protected static $author_id;

	/**
	 * Another commenter user ID.
	 *
	 * @var int
	 */
	protected static $commenter_id;

	/**
	 * Comment IDs.
	 *
	 * @var int[]
	 */
	protected static $comment_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id    = $factory->user->create( array( 'display_name' => 'Post Author' ) );
		self::$commenter_id = $factory->user->create( array( 'display_name' => 'Reader User' ) );

		self::$post_id = $factory->post->create(
			array(
				'post_author' => self::$author_id,
				'post_title'  => 'Test Post with Comments',
				'post_status' => 'publish',
			)
		);

		// Comment 1: Guest comment.
		self::$comment_ids[] = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_author'   => 'Guest Visitor',
				'user_id'          => 0,
				'comment_content'  => 'Guest comment content',
				'comment_approved' => 1,
				'comment_date_gmt' => '2025-01-01 10:00:00',
			)
		);

		// Comment 2: Registered reader comment.
		self::$comment_ids[] = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_author'   => 'Reader User',
				'user_id'          => self::$commenter_id,
				'comment_content'  => 'Reader comment content',
				'comment_approved' => 1,
				'comment_date_gmt' => '2025-01-01 11:00:00',
			)
		);

		// Comment 3: Post author reply comment.
		self::$comment_ids[] = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_author'   => 'Post Author',
				'user_id'          => self::$author_id,
				'comment_content'  => 'Author reply content',
				'comment_approved' => 1,
				'comment_date_gmt' => '2025-01-01 12:00:00',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$comment_ids as $comment_id ) {
			wp_delete_comment( $comment_id, true );
		}
		wp_delete_post( self::$post_id, true );
		wp_delete_user( self::$author_id );
		wp_delete_user( self::$commenter_id );
	}

	/**
	 * Test default rendering includes post author comments.
	 */
	public function test_render_latest_comments_includes_post_author_by_default() {
		$attributes = array(
			'commentsToShow'    => 5,
			'displayAvatar'     => false,
			'displayDate'       => false,
			'displayContent'    => 'none',
			'excludePostAuthor' => false,
		);

		$output = render_block_core_latest_comments( $attributes );

		$this->assertStringContainsString( 'Post Author', $output );
		$this->assertStringContainsString( 'Reader User', $output );
		$this->assertStringContainsString( 'Guest Visitor', $output );
	}

	/**
	 * Test that excludePostAuthor excludes post author comments.
	 */
	public function test_render_latest_comments_excludes_post_author_when_enabled() {
		$attributes = array(
			'commentsToShow'    => 5,
			'displayAvatar'     => false,
			'displayDate'       => false,
			'displayContent'    => 'none',
			'excludePostAuthor' => true,
		);

		$output = render_block_core_latest_comments( $attributes );

		$this->assertStringNotContainsString( 'Post Author', $output );
		$this->assertStringContainsString( 'Reader User', $output );
		$this->assertStringContainsString( 'Guest Visitor', $output );
	}
}
