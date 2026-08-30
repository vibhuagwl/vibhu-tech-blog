package com.example.flashsale.flash.domain.model;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "flash_sale_products")
@IdClass(FlashSaleProduct.Pk.class)
public class FlashSaleProduct {
    @Id
    @Column(name = "sale_id")
    private String saleId;

    @Id
    @Column(name = "product_id")
    private String productId;

    private String name;

    @Column(name = "price_cents")
    private long priceCents;

    protected FlashSaleProduct() {
    }

    public String getSaleId() {
        return saleId;
    }

    public String getProductId() {
        return productId;
    }

    public String getName() {
        return name;
    }

    public long getPriceCents() {
        return priceCents;
    }

    public static class Pk implements Serializable {
        private String saleId;
        private String productId;

        public Pk() {
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof Pk pk)) {
                return false;
            }
            return Objects.equals(saleId, pk.saleId) && Objects.equals(productId, pk.productId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(saleId, productId);
        }
    }
}
