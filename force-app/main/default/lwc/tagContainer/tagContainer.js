import { LightningElement,track } from 'lwc';
import searchTag from '@salesforce/apex/cpqTagsSearch.cpqSearchTag';
import FORM_FACTOR from '@salesforce/client/formFactor';
const REGEX_STOCK_RES = /(stock|sock|limited|limted|lmited|limit|close-out|close out|closeout|close  out|exempt|exmpet|exemept|southern stock|southernstock|southner stock)/g; 
const REGEX_COMMA = /(,)/g;
const REGEX_24D = /2,4-D|2 4-d|2, 4-D/gi
const REGEX_SLASH = /-/g; 
const REGEX_FERT = /(\d{1,2}\s*-)(\s*\d{1,2}\s*-)(\s*\d{1,2})/g; 
const REGEX_NOWHITESPACE = /\s/g;
const REGEX_WAREHOUSE = /wh\s*\d\d\d/gi;
import {spellCheck, cpqSearchString, uniqVals} from 'c/tagHelper';
export default class TagContainer extends LightningElement {
    @track tagCards = [];
    searchTerm;
    stock; 
    loaded = false; 
    formSize;
    priceBook = '01s410000077vSKAAY'; 
    searchSize;
    isFert;  
    whSearch; 
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
            this.searchTwo(); 
        }
    }

    handleSearch(e){
        e.preventDefault();
        this.searchTwo(); 
    }
   async searchTwo(){
            let searchInput = this.template.querySelector('[data-value="searchInput"]').value.trim().toLowerCase()
            
            if(searchInput.length<3){
                //add lwc alert here
                return;
            }
            
            this.loaded = false;
            //check for stock status was entered those values will be in the regex above
            this.stock = searchInput.match(REGEX_STOCK_RES); 
            //grab fertilizers which are commonly searched for in 1 or 2 digits then - i.e. 23-4-9
            this.isFert = searchInput.match(REGEX_FERT);
            //if fertilizer remove any mistaken which space
            this.isFert = !this.isFert ? '' : this.isFert[0].replace(REGEX_NOWHITESPACE, '').replace(REGEX_SLASH,'\-'); 
            //grab non fertilizer search inputs. 2,4-D is a common product the ',' causes issues. Remove Fertilizer, Escape Hyphen,  Commas  add the 'and' to filter ie car , red  query would be car and red
            //remove stock status that is in the where clause of nested soql. Trim the search. 
            this.searchTerm = searchInput.replace(REGEX_24D, '2 4-D').replace(REGEX_FERT,'').replace(REGEX_SLASH,'\-').replace(REGEX_COMMA, ' and ').replace(REGEX_STOCK_RES,'').replace(REGEX_WAREHOUSE,'').split(' ').sort().join(' ').trim();
            //need to combine fert and searchTerm
            let finalSearch =  `\\"${this.isFert}\\" ${this.searchTerm}`
            this.whSearch = searchInput.replace(REGEX_NOWHITESPACE, "").match(REGEX_WAREHOUSE);
            let searchRacks;
            let backUpQuery;
            if(this.stock){
                this.stock = spellCheck(this.stock[0])  
            }
            //pass to a helper to build the search query, warehouse parse and stock status
            let buildSearchInfo = cpqSearchString(this.searchTerm, this.stock, this.whSearch) 
                this.searchQuery = buildSearchInfo.builtTerm;
                searchRacks = buildSearchInfo.wareHouseSearch; 
                backUpQuery = buildSearchInfo.backUpQuery
            console.log(`sending: `,this.searchQuery);
            
            let data = await searchTag({searchKey: this.searchQuery, searchWareHouse:searchRacks, backUpSearch: backUpQuery}) 
            //here we split up the returned wrapper. 
            //access the tags object using data.tags and the warehouse search using data.wareHouseFound
            let tags = data.tags != undefined ? data.tags : []
            let backUpSearchUsed = data.backUpSearchUsed;
            let once = tags.length> 1 ? await uniqVals(tags) : tags;
            this.searchSize = once.length; 
            this.tagCards = await once.map((item, index) =>({
                                ...item, 
                                name:  item.Product_Name__c,  
                                url: `https://advancedturf.lightning.force.com/lightning/r/Product2/${item.Product__c}/related/ProductItems/view`,
                                ProductCode: item.Product_Code__c,
                                score: item.ATS_Score__c,
                                Status: item.Stock_Status__c,
                                tagDesc: item.Search_Slug_2__c
                                //rowVariant: item.Product__r.Temp_Unavailable__c ? 'border-filled' : 'brand',
                                //rowName: item.Product__r.Temp_Unavailable__c ? 'action:freeze_user' : 'action:new',
                                //rowValue: item.Product__r.Temp_Unavailable__c ? 'unavailable' :'Add',
                                //Floor_Price__c: item.Floor_Price__c,
                                //Floor: item.Product__r.Floor_Type__c,
                                //qtyOnHand: item.Product__r.Total_Product_Items__c, 
                                //css to set the pop up box on table
                                //classV: index <= 1 ? 'topRow' : 'innerInfo',
                                //progScore: item?.W_Program_Score__c ?? 'not set',getPickListValues
                                //profit: item?.W_Product_Profitability__c,
                                //invScore: item?.W_Inventory_Score__c ?? 'not set',
                                //fp: item?.W_Focus_Product__c ?? 0,
                                //searchIndex: index + 1
                                
            }))
            //show no inventory found
            if(backUpSearchUsed){
                let  DIDNT_FIND_AT_WAREHOUSE = [{Id:'1343', name:`Not yet tagged for ${this.whSearch}, confirm Inventory after Selection`}]
                this.tagCards =  [...DIDNT_FIND_AT_WAREHOUSE, ...this.tagCards] 
            }
            this.loaded = true;
            this.error = undefined;
            // searchTag({ searchKey: this.searchTerm})
            // .then((res)=>{
            //     let name; 
            //     let score;
            //     let url;
            //     let tagDesc
            //     this.tagCards = res.map(x=>{
                
            //         name = x.Product_Name__c,
            //         score = x.ATS_Score__c
            //         //url = 'https://advancedturf--full.sandbox.lightning.force.com/lightning/r/Product2/'+x.Product__c+'/related/ProductItems/view'
            //         url = 'https://advancedturf.lightning.force.com/lightning/r/Product2/'+x.Product__c+'/related/ProductItems/view';
            //         tagDesc = x.Tag_Description__c
            //         return {...x, name, score, url, tagDesc}
            //     })
                
            //     this.loaded = true; 
            // })
    }
    
    handleInv(){
        alert('hey')
    }
}