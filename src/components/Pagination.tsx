'use client';

import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseHref: string; // ページ番号を除いたベースURL (例: /questions, /tags/初心者)
}

export default function Pagination({
    currentPage,
    totalPages,
    baseHref,
}: PaginationProps) {
    const createPageUrl = (page: number) => {
        if (page <= 1) {
            return baseHref; // 1ページ目はクエリパラメータなし
        }
        return `${baseHref}?page=${page}`;
    };

    // 表示するページ番号のリストを生成 (例: ... 3, 4, 5, 6, 7 ...)
    const getPageNumbers = () => {
        const delta = 2; // 現在ページの前後に表示するページ数
        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            range.unshift(NaN); // 省略を示す NaN
        }
        if (currentPage + delta < totalPages - 1) {
            range.push(NaN);
        }

        range.unshift(1); // 常に1ページ目を表示
        if (totalPages > 1) {
             range.push(totalPages); // 常に最終ページを表示 (1ページのみの場合は除く)
        }

        // 重複を除去 (totalPagesが小さい場合に発生する可能性)
        return [...new Set(range)]; 
    };

    const pageNumbers = getPageNumbers();

    return (
        <nav aria-label="Pagination" className="flex justify-center items-center space-x-2 mt-8 mb-4">
            {/* 前へボタン */}
            <Link
                href={createPageUrl(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                前へ
            </Link>

            {/* ページ番号 */}
            {pageNumbers.map((page, index) => (
                <span key={index}>
                    {isNaN(page) ? (
                        <span className="text-gray-500">...</span>
                    ) : (
                        <Link
                            href={createPageUrl(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`inline-flex items-center px-3 py-1 border ${currentPage === page ? 'border-blue-500 bg-blue-50 text-blue-600 z-10' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium rounded-md`}
                        >
                            {page}
                        </Link>
                    )}
                </span>
            ))}

            {/* 次へボタン */}
            <Link
                href={createPageUrl(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                次へ
            </Link>
        </nav>
    );
} 