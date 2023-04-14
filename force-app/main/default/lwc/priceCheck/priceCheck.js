import { LightningElement,track,api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import checkPrice from '@salesforce/apex/quickPriceSearch.getPricing';
//import inCounts from '@salesforce/apex/cpqApex.inCounts';
import {newInventory,allInventory, roundNum} from 'c/helper' 

export default class PriceCheck extends LightningElement {
    searchTerm;
    priceBook = '01s410000077vSKAAY';
    loaded; 
    formSize;
    isPinned = false; 
    showWarn = false; 
    @track pinnedCards = [];
    @track prod = [];
    
    connectedCallback(){ 
        this.formSize = this.screenSize(FORM_FACTOR);
        this.loaded = true;     
    }

    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }

    handleKeys(evt){
        let enterKey = evt.keyCode === 13;
        if(enterKey){
            this.searchTerm = evt.target.value;
            this.handleSearch();
        }
    }
    
    handleSearch(){
        this.searchTerm = this.template.querySelector('[data-value="searchInput"]').value
        if(this.searchTerm.length<3){
            //add lwc alert here
            return;
        }
        this.loaded = false
        checkPrice({priceBookId: this.priceBook, searchKey: this.searchTerm})
        .then((res)=>{
                let name;
                let cost; 
                let flr;
                let lev1;
                let lev2;
                let slug; 
                let stock;
                let allStock;
                let ProductCode;  
                let url; 
                let showPricing
                let displayPrice;
                let displayMargin; 
                this.prod = res.map(x=>{
                    name= x.Product2.Name + ' - '+ x.Product2.ProductCode,
                    cost = x.Agency_Product__c ? 'Agency' : x.Product_Cost__c,
                    flr = x.Floor_Price__c,
                    lev1 = x.Level_1_UserView__c,
                    lev2 = x.Level_2_UserView__c,
                    slug = x.Agency_Product__c ? `Agency - $${flr}`:`cost $${cost}  flr $${flr}-${x.Floor_Margin__c}%   Level 1 $${lev1}`
                    stock = x.Product2.Product_Status__c,
                    allStock = x.Product2.Total_Product_Items__c
                    ProductCode = x.Product2.ProductCode,
                    url = 'https://advancedturf.lightning.force.com/lightning/r/'+x.Product2Id+'/related/ProductItems/view'
                    showPricing = false; 
                    displayPrice = x.Level_2_UserView__c
                    displayMargin = x.Level_2_Margin__c 

                    return {...x, name, cost, flr, lev1, lev2, slug, stock, allStock, ProductCode,url, showPricing, displayPrice, displayMargin}
                })

        }).then(()=>{
            this.loaded = true; 
            this.searchTerm = ''; 
            let x = this.template.querySelector('lightning-input').value;
            x = ''; 
            //console.log(JSON.stringify(this.prod));
            
        })
    }
 
    openInputs(evt){
        let targId = evt.currentTarget.dataset.name
        let index = this.prod.findIndex(x=>x.Id === targId)
        this.prod[index].showPricing = true;
    }
    closeInputs(evt){
        let targId = evt.currentTarget.dataset.close
        let index = this.prod.findIndex(x=>x.Id === targId)
        this.prod[index].showPricing = false;
    }
    
    handleMargin(evt){
        window.clearTimeout(this.delay)
        let margin = Number(evt.target.value)/100; 
        let index = this.prod.findIndex(x=>x.Id === evt.target.name);
        this.delay = setTimeout(()=>{
            let cost = this.prod[index].cost;
            
            this.prod[index].displayPrice = roundNum((cost/(1- margin)), 2 );
            this.prod[index].displayMargin = margin * 100; 
        },500)
        
    }
    fadeWarn(){
        this.showWarn = true;
        window.clearTimeout(this.delay);
        this.delay = setTimeout(()=>{
            this.showWarn = false;
        },1000)
    }
    pinCard(evt){
        let x = this.prod.find((y)=> y.Id === evt.currentTarget.dataset.pin);
        if(this.pinnedCards.length<2){
            this.pinnedCards = [...this.pinnedCards, x]
            this.isPinned = true; 
            this.prod.splice(this.prod.findIndex(a=>a.Id ===x.Id), 1)
        }else{
            this.fadeWarn();
        }
    }
    unPinCard(evt){
        let index = this.pinnedCards.findIndex(y=> y.Id === evt.currentTarget.dataset.unpin);
        this.pinnedCards.splice(index,1);
        this.isPinned = this.pinnedCards.length > 0 ? true : false;
    }
    addCard(){
        console.log('adding ');
        
    }

    checkInv(){
        console.log('check inv');
        
    }
}