import { handleError } from './errorUtils.mjs';

export default (err, req, res, next) => {
    // Always log internally so operators can debug.
    console.error('[unhandled]', err);

    const isProd = process.env.NODE_ENV === 'production';
    const additional = {
        message: '🚨 An unexpected error occurred. Please try again later.',
        details: '🔍 If the problem persists, contact support for assistance.\n⤷ https://github.com/rn0x'
    };
    if (!isProd) {
        // Only include the stack trace in development — never to public clients.
        additional.stack = err?.stack;
    }
    handleError(res, 500, 'Server Error.', additional);
};
