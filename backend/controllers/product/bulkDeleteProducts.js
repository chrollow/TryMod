import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";

const bulkDeleteProducts = async (req, res) => {
    try {
        const { productIds } = req.body;

        // Check if productIds is a valid array
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid product IDs provided for deletion.",
            });
        }

        // Step 1: Delete the products from the database
        const deleteResponse = await productModel.deleteMany({
            _id: { $in: productIds },
        });

        // If no products were deleted
        if (deleteResponse.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found to delete.",
            });
        }

        // Step 2: Remove products from all users' wishlists
        await userModel.updateMany(
            { wishlist: { $in: productIds } },
            { $pull: { wishlist: { $in: productIds } } }
        );

        // Step 3: Remove products from order history
        await orderModel.updateMany(
            { "products.productId": { $in: productIds } },
            { $pull: { products: { productId: { $in: productIds } } } }
        );

        // Return success message with the number of deleted products
        res.status(200).json({
            success: true,
            message: `${deleteResponse.deletedCount} products deleted successfully.`,
        });
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while bulk deleting products.",
            error: error.message || error,
        });
    }
};

export default bulkDeleteProducts;
