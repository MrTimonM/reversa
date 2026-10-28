// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ReversaEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Course {
        uint256 courseId;
        address creator;
        uint256 price; // in USDC atomic units (6 decimals)
        uint256 refundWindow; // seconds
        bool active;
        string title;
        string description;
    }

    struct Purchase {
        uint256 purchaseId;
        uint256 courseId;
        address student;
        address creator;
        uint256 amount; // snapshot of price at purchase time
        uint256 refundWindow; // snapshot of refundWindow at purchase time
        uint256 purchasedAt;
        uint256 refundDeadline; // purchasedAt + refundWindow
        PurchaseStatus status;
    }

    enum PurchaseStatus {
        Protected,
        Refunded,
        Released
    }

    event CourseCreated(
        uint256 indexed courseId,
        address indexed creator,
        uint256 price,
        uint256 refundWindow,
        string title
    );

    event CourseUpdated(uint256 indexed courseId, uint256 price, uint256 refundWindow, bool active);

    event PurchaseMade(
        uint256 indexed purchaseId,
        uint256 indexed courseId,
        address indexed student,
        address creator,
        uint256 amount,
        uint256 refundDeadline
    );

    event RefundIssued(uint256 indexed purchaseId, address indexed student, uint256 amount);

    event PaymentReleased(uint256 indexed purchaseId, address indexed creator, uint256 amount);

    uint256 public nextCourseId;
    uint256 public nextPurchaseId;

    mapping(uint256 => Course) public courses;
    mapping(uint256 => Purchase) public purchases;
    mapping(address => uint256[]) private _studentPurchases;
    mapping(address => uint256[]) private _creatorPurchases;
    mapping(address => uint256[]) private _creatorCourses;

    IERC20 private immutable _usdc;

    constructor(address _usdcAddress, address initialOwner) Ownable(initialOwner) {
        require(_usdcAddress != address(0), "USDC is zero address");
        // Ensure the address is a contract, not an EOA
        uint256 size;
        assembly { size := extcodesize(_usdcAddress) }
        require(size > 0, "USDC address is not a contract");
        _usdc = IERC20(_usdcAddress);
    }

    function createCourse(
        string calldata title,
        string calldata description,
        uint256 price,
        uint256 refundWindow
    ) external returns (uint256 courseId) {
        require(price > 0, "Price must be greater than zero");
        require(refundWindow >= 30 seconds && refundWindow <= 365 days, "Invalid refund window (30s-365d)");
        require(bytes(title).length > 0, "Title cannot be empty");

        // Safe: nextCourseId would require 2^256 courses to overflow — impossible in practice
        unchecked {
            nextCourseId++;
        }
        courseId = nextCourseId;

        courses[courseId] = Course({
            courseId: courseId,
            creator: msg.sender,
            price: price,
            refundWindow: refundWindow,
            active: true,
            title: title,
            description: description
        });

        _creatorCourses[msg.sender].push(courseId);

        emit CourseCreated(courseId, msg.sender, price, refundWindow, title);
    }

    function updateCourse(uint256 courseId, uint256 price, uint256 refundWindow, bool active) external {
        Course storage course = courses[courseId];

        require(course.creator == msg.sender, "Not the creator");
        require(price > 0, "Price must be greater than zero");
        require(refundWindow >= 30 seconds && refundWindow <= 365 days, "Invalid refund window (30s-365d)");
        require(bytes(course.title).length > 0, "Title cannot be empty");

        course.price = price;
        course.refundWindow = refundWindow;
        course.active = active;

        emit CourseUpdated(courseId, price, refundWindow, active);
    }

    /**
     * @param courseId The course to purchase.
     * @param expectedPrice The price the student saw off-chain. Reverts if the creator changed it.
     * @param expectedRefundWindow The refund window the student saw. Reverts if changed.
     */
    function purchaseCourse(
        uint256 courseId,
        uint256 expectedPrice,
        uint256 expectedRefundWindow
    ) external nonReentrant returns (uint256 purchaseId) {
        Course storage course = courses[courseId];

        require(course.creator != address(0), "Course does not exist");
        require(course.active, "Course not active");
        require(course.price > 0, "Invalid course price");
        // Slippage guard: protect buyer from front-run term changes
        require(course.price == expectedPrice, "Price changed before purchase");
        require(course.refundWindow == expectedRefundWindow, "Refund window changed before purchase");

        uint256 amount = course.price;
        uint256 refundWindow = course.refundWindow;
        address creator = course.creator;
        uint256 purchasedAt = block.timestamp;
        uint256 refundDeadline = purchasedAt + refundWindow;

        // Safe: nextPurchaseId would require 2^256 purchases to overflow — impossible in practice
        unchecked {
            nextPurchaseId++;
        }
        purchaseId = nextPurchaseId;

        purchases[purchaseId] = Purchase({
            purchaseId: purchaseId,
            courseId: courseId,
            student: msg.sender,
            creator: creator,
            amount: amount,
            refundWindow: refundWindow,
            purchasedAt: purchasedAt,
            refundDeadline: refundDeadline,
            status: PurchaseStatus.Protected
        });

        _studentPurchases[msg.sender].push(purchaseId);
        _creatorPurchases[creator].push(purchaseId);

        _usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit PurchaseMade(purchaseId, courseId, msg.sender, creator, amount, refundDeadline);
    }

    function requestRefund(uint256 purchaseId) external nonReentrant {
        Purchase storage purchase = purchases[purchaseId];

        require(purchase.student == msg.sender, "Not the student");
        require(purchase.status == PurchaseStatus.Protected, "Not protected");
        require(block.timestamp <= purchase.refundDeadline, "Refund window expired");

        uint256 amount = purchase.amount;
        purchase.status = PurchaseStatus.Refunded;

        _usdc.safeTransfer(msg.sender, amount);

        emit RefundIssued(purchaseId, msg.sender, amount);
    }

    function releasePayment(uint256 purchaseId) external nonReentrant {
        Purchase storage purchase = purchases[purchaseId];

        require(purchase.creator == msg.sender, "Not the creator");
        require(purchase.status == PurchaseStatus.Protected, "Not protected");
        require(block.timestamp > purchase.refundDeadline, "Refund window active");

        uint256 amount = purchase.amount;
        purchase.status = PurchaseStatus.Released;

        _usdc.safeTransfer(msg.sender, amount);

        emit PaymentReleased(purchaseId, msg.sender, amount);
    }

    function getCourse(uint256 courseId) external view returns (Course memory) {
        return courses[courseId];
    }

    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        return purchases[purchaseId];
    }

    function getStudentPurchaseIds(address student) external view returns (uint256[] memory) {
        return _studentPurchases[student];
    }

    function getCreatorPurchaseIds(address creator) external view returns (uint256[] memory) {
        return _creatorPurchases[creator];
    }

    function getCreatorCourseIds(address creator) external view returns (uint256[] memory) {
        return _creatorCourses[creator];
    }

    function getRefundTimeRemaining(uint256 purchaseId) external view returns (uint256) {
        uint256 deadline = purchases[purchaseId].refundDeadline;
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    function usdcToken() external view returns (address) {
        return address(_usdc);
    }
}
