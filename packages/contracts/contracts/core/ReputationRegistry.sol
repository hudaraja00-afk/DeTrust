// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract ReputationRegistry is Ownable, Pausable {
	struct FeedbackRecord {
		bytes32 jobId;
		address reviewer;
		address reviewed;
		bytes32 contentHash;
		uint8 rating;
		uint256 timestamp;
	}

	mapping(address => FeedbackRecord[]) private userFeedback;
	mapping(bytes32 => mapping(address => bool)) public feedbackSubmitted;

	event FeedbackRecorded(
		bytes32 indexed jobId,
		address indexed reviewer,
		address indexed reviewed,
		bytes32 contentHash,
		uint8 rating
	);

	constructor() Ownable(msg.sender) {}

	function recordFeedback(bytes32 jobId, address reviewed, bytes32 contentHash, uint8 rating)
		external
		whenNotPaused
	{
		require(jobId != bytes32(0), "Invalid jobId");
		require(reviewed != address(0) && reviewed != _msgSender(), "Invalid reviewed");
		require(rating >= 1 && rating <= 5, "Rating out of range");
		require(!feedbackSubmitted[jobId][_msgSender()], "Already submitted");

		feedbackSubmitted[jobId][_msgSender()] = true;

		FeedbackRecord memory record = FeedbackRecord({
			jobId: jobId,
			reviewer: _msgSender(),
			reviewed: reviewed,
			contentHash: contentHash,
			rating: rating,
			timestamp: block.timestamp
		});

		userFeedback[reviewed].push(record);

		emit FeedbackRecorded(jobId, _msgSender(), reviewed, contentHash, rating);
	}

	function getUserFeedback(address user) external view returns (FeedbackRecord[] memory) {
		return userFeedback[user];
	}

	function getFeedbackCount(address user) external view returns (uint256) {
		return userFeedback[user].length;
	}

	function getAverageRating(address user) external view returns (uint256 averageTimes100, uint256 count) {
		FeedbackRecord[] memory feedback = userFeedback[user];
		count = feedback.length;
		if (count == 0) {
			return (0, 0);
		}

		uint256 total;
		for (uint256 i = 0; i < feedback.length; i++) {
			total += feedback[i].rating;
		}

		averageTimes100 = (total * 100) / count;
	}

	function pause() external onlyOwner {
		_pause();
	}

	function unpause() external onlyOwner {
		_unpause();
	}
}
