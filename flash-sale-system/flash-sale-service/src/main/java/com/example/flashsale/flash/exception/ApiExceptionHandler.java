package com.example.flashsale.flash.exception;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(FlashSaleException.class)
    public ProblemDetail onDomain(FlashSaleException ex) {
        HttpStatus status = switch (ex.code()) {
            case RATE_LIMITED -> HttpStatus.TOO_MANY_REQUESTS;
            case PRODUCT_SOLD_OUT, DUPLICATE_PURCHASE -> HttpStatus.CONFLICT;
            case SALE_NOT_ACTIVE, SALE_ENDED, INVALID_REQUEST -> HttpStatus.BAD_REQUEST;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case SERVICE_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        pd.setType(URI.create("https://flash-sale.example/errors/" + ex.code()));
        pd.setProperty("code",
                ex.code()
                        .name());
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail onUnknown(Exception ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
        pd.setProperty("code", ErrorCode.SERVICE_UNAVAILABLE.name());
        pd.setProperty("debug",
                Map.of("type",
                        ex.getClass()
                                .getSimpleName()));
        return pd;
    }
}
