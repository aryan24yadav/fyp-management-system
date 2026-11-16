export const generateToken = (user,statusCode,message,res) => {
    const token = user.generateToken();
    const isProduction = process.env.NODE_ENV === "production";
    res.status(statusCode)
    .cookie("token", token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 1000 * 60 * 60 * 24),
        httpOnly: true,
        secure: isProduction,  // only HTTPS in production; http in local dev
        sameSite: isProduction ? "None" : "Lax",
    })
    .json({
        success: true,
        message,
        token,
        user,
    });
}