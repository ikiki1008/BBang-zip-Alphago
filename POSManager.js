//================================================================
class Product {
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
}
//================================================================
class Item {
    constructor(product) {
        this.product = product;
        this.count = 1;
        this.total = this.product.price;
    }
}
//================================================================
class Order {
    constructor() {
            this.items = [];
            this.total = 0;
            this.paid = 0;
            this.change = 0;
            this.dateOrder = new Date().toString();
            this.lastItemIndex = -1; //취소용
            this.lastItemCountChange = 0;
    }
    //--------------------------------------------------------
    setOrderPaid(val) {
        this.paid = val;
        this.calculateChange();
    }
    getOrderPaid() {
        return this.paid;
    }
    getOrderChange() {
        return this.change;
    }
    calculateChange() {
        this.change = this.paid - this.total;
    }
    //--------------------------------------------------------
    addItem(product) {
            for (let i in this.items) {
                if (product === this.items[i].product) {
                    increaseBGM.play();
                    this.items[i].count++;
                    this.lastItemIndex = Number(i);
                    this.calculateTotal();
                    return `.order_${product.name}`;
                    // return this.lastItemIndex;
                }
            }
            insertBGM.play();
            this.items.push(new Item(product));
            this.lastItemIndex = this.items.length - 1;
            this.calculateTotal();
            return `#order_${product.name}`;
            // return this.lastItemIndex;
        }
        //--------------------------------------------------------
    cancelLast() {
        let id = `order_${this.items[this.lastItemIndex].product.name}`;
        if(this.adjustItemCount(this.lastItemIndex, -1)) {
            this.lastItemIndex = -1;
            return '.'+id;
        }
        this.lastItemIndex = -1;
        return '#'+id;
    }
    //--------------------------------------------------------
    adjustItemCount(idx, amount) {
            if (idx >= 0 && idx < this.items.length) { //정상적인 item index이면
                this.items[idx].count += amount;
                if (this.items[idx].count <= 0) {
                    this.items.splice(idx, 1);
                    this.lastItemIndex = -1;
                    this.calculateTotal();
                    return false;
                }
                this.calculateTotal();
                return true;
            }
        }
        //--------------------------------------------------------
    setItemCount(idx, count) {
            if (idx >= 0 && idx < this.items.length) { //정상적인 item index이면
                this.items[idx].count = count;
                if (this.items[idx].count <= 0) {
                    this.items.splice(idx, 1);
                    this.lastItemIndex = -1;
                }
                this.calculateTotal();
            }
            return `.order_${this.items[idx].product.name}`;
        }
        //--------------------------------------------------------
    setLastCount(count) {
            this.setItemCount(this.lastItemIndex, count);
            this.calculateTotal();
            // return `.order_${product.name}`;
            return `.order_${this.items[this.lastItemIndex].product.name}`;
        }
        //--------------------------------------------------------
    calculateTotal() {
            this.total = 0;
            for (let item of this.items) {
                item.total = item.product.price * item.count;
                this.total += item.total;
            }
            this.calculateChange();
        }
        //--------------------------------------------------------

}
//================================================================
class POSManager {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    constructor() {
            this.dateStart = new Date();
            this.products = [];
            this.orders = [];
            this.currentOrder = null;
            this.target = null;
            this.sumTarget = null;
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POS 정보를 출력할 HTML tag 지정 (보통, div)
        //  target.innerHTML <- 출력할 내용
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    targetIs(target, sumtarget) {
            this.target = target;
            this.sumTarget = sumtarget;
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    addProduct(product) {
            for (let p of this.products) {
                if (product.name === p.name) {
                    return 0;
                }
            }
            this.products.push(product);
            return this.products.length;
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    readProducts(filepath) {
        let prdSrc = [];
        $.ajax({
            url: filepath,
            dataType: "json",
            type: "GET",
            async: false,
            success: function(data) {
                for(var item of data) {
                    prdSrc.push(new Product(item['classname'], Number(item['unit_price'])));
                }
            }
        })
        for (let prd of prdSrc) {
            this.addProduct(prd);
        }
        this.showProducts();
    }
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    findProduct(name) {
            for (let p of this.products) {
                if (p.name === name)
                    return p;
            }
            console.log(`Order.findProduct: not found product "${name}"`);
            return null;
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    newOrder() {
            if (this.currentOrder) {
                this.currentOrder.lastItemIndex = -1;
                this.orders.push(this.currentOrder);
                this.addLocalStorage();
            }
            this.currentOrder = new Order();
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    addLocalStorage() {
        var orderObject = this.currentOrder;
        localStorage[orderObject.dateOrder] = (JSON.stringify(orderObject));
    }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    loadLocalStorage() {
        for(var i = 0; i < localStorage.length; i++) {
            this.orders.push(JSON.parse(localStorage[localStorage.key(i)]));
        }
    }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    addItem(name) {
            if (this.currentOrder === null)
                this.currentOrder = new Order();
            let product = this.findProduct(name);
            if (product)
                this.currentOrder.addItem(product);
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    showCurrentOrder() {
            // console.log('=======Items of current Order==========');
            // for (let item of this.currentOrder.items) {
            //     console.log(`[${item.product.name}]: ${item.product.price} x ${item.count} = ${item.product.price * item.count}`);
            // }
            // console.log('=======End of current Order==========');
            // console.log(`Total: ${this.currentOrder.total}원`);
            let currentOrders = "";
            for(var i in this.currentOrder.items) {
                currentOrders += `<tr id='order_${this.currentOrder.items[i].product.name}'>`;
                currentOrders += "<td><div>";
                currentOrders += this.currentOrder.items[i].product.name;
                currentOrders += "</div></td>";
                currentOrders += "<td><div>";
                currentOrders += this.insertComma(this.currentOrder.items[i].product.price);
                currentOrders += "</div></td>";
                currentOrders += `<td class='order_${this.currentOrder.items[i].product.name}'><div>`;
                currentOrders += `<div id='minus_icon' style='display:inline-block;'><img src='./icons/minus.png' alt='Plus_icon' style='width: 20px; height: 20px;' onclick='btn_event("minus", ${i})'></div>`;
                currentOrders += "<div id='count' style='display:inline-block;'>";
                currentOrders += "&nbsp" + this.currentOrder.items[i].count + "&nbsp";
                currentOrders += "</div>";
                currentOrders += `<div id='plus_icon' style='display:inline-block;'><img src='./icons/add.png' alt='Plus_icon' style='width: 20px; height: 20px;' onclick='btn_event("plus", ${i})'></div>`;
                currentOrders += "</div></td>";
                currentOrders += `<td class='order_${this.currentOrder.items[i].product.name}'><div>`;
                currentOrders += this.insertComma(this.currentOrder.items[i].total);
                currentOrders += "</div></td>";
                currentOrders += "</tr>";
            }
            this.target.innerHTML = currentOrders;
            this.sumTarget.innerText = this.insertComma(this.currentOrder.total);
            this.refreshPC();
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    cancelLast() {
        cancelBGM.play();
        let id;
            if (this.currentOrder) {
                id = this.currentOrder.cancelLast();
                console.log(id);
                if(id[0] == '#')
                    this.insertAnimation(id, callShowCurrentOrder);
                else {
                    this.showCurrentOrder();
                    this.insertAnimation(id);
                }
            }
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    showProducts() {
            if (this.target) {
                if (this.products.length > 0) {
                    for (let product in this.products) {
                        this.target.empty();
                    }

                } else {
                    this.target.innerHTML = "등록된 상품이 없습니다.";
                }

            } else { //targetTag가 지정되어 있지 않으면(null) 콘솔에 오류 출력
                for (let p of this.products)
                    console.log(`[${p.name}]: ${p.price}원`);
            }
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    addOrderItem(product) {
        let id = this.currentOrder.addItem(this.findProduct(product));
        this.showCurrentOrder();

        this.insertAnimation(id);
    }
    setLastOrderCount(amount) {
        let id = this.currentOrder.setLastCount(amount);
        this.showCurrentOrder();

        this.insertAnimation(id);
    }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    insertAnimation(target_id, callbacks) {
        let target = $(target_id);
        let div = $(target_id + " > td > div");
        if(callbacks !== undefined) {
            div.slideUp('slow', callbacks);
        } else {
            div.hide();
            div.slideDown();
            target.css({borderTopColor: 'rgba(251, 206, 177)', borderLeftColor: 'rgba(251, 206, 177)', borderRightColor: 'rgba(251, 206, 177)', backgroundColor: 'rgba(255, 229, 211)'});
            target.animate({borderTopColor: 'rgba(251, 206, 177, 0)', borderLeftColor: 'rgba(251, 206, 177, 0)', borderRightColor: 'rgba(251, 206, 177, 0)', backgroundColor: 'rgba(255, 229, 211, 0)'}, 1500);
        }
    }

    getOrderItemCount(index) {
        for(var item of this.currentOrder.items) {
            if (item.product.name == this.currentOrder.items[index].product.name) {
                return item.count;
            }
        }
    }

    setOrderItemCount(index, count) {
        let id = this.currentOrder.setItemCount(index, count);
        this.showCurrentOrder();

        this.insertAnimation(id);
    }
    insertComma(value) {
        var output = "";
        for(var i=1;i <= String(value).length; i++) {
            output = String(value)[String(value).length-i] + output;
            if(Number.isInteger(i/3))
                if(i != String(value).length) // 마지막 루프 체크.. 이부분이 없으니 "100,000"이 ",100,000"으로 나오더라 ...
                    output = "," + output;
        }
        return output;
    }
    complete() {
        $('.orderCard').slideUp('slow', function() {
            $('#complete').slideDown('slow', function() {
                setTimeout(function() {
                    pos.newOrder;
                    $('#complete').slideUp('slow', function() {
                        $('.orderCard').slideDown();
                    })
                }, 1000);
            });
        });
    }
    setCurrentOrderPaid(val) {
        if(isNaN(val) === true) return 1;
        if(Number(val) > 100000000) return 2;
        this.currentOrder.setOrderPaid(Number(val));
        this.refreshPC();
    }
    getCurrentOrderPaid() {
        return this.currentOrder.getOrderPaid();
    }
    getCurrentOrderChange() {
        return this.currentOrder.getOrderChange();
    }
    refreshPC() {
        $('#paid')[0].innerHTML = this.insertComma(this.getCurrentOrderPaid());
        $('#change')[0].innerHTML = this.insertComma(this.getCurrentOrderChange());
    }
}
// let p1 = new Product('a', 100);
// let p2 = new Product('b', 200);
// let pos = new POSManager();
// pos.readProducts(productSource);
// pos.addProduct(p1);
// pos.addProduct(p2);
//================================================================