const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// get all products through the endpoints (/api/products)
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{model:Category},{model:Tag}],
    });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product from the endpoints (/api/products/:id)
router.get('/:id', async(req, res) => {
  try {
    const singleProduct = await Product.findByPk(req.params.id, {
      include:[{model:Category},{model:Tag}],
    });
    if (!singleProduct) {
      res.status(404).json({message: "no such product with that id"});
      return;
    }
    res.status(200).json(singleProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product through end points (/api/products)
router.post('/', async (req, res) => {
  try {
    const productData = await Product.create(req.body)
    res.status(200).json(productData);
  } catch (err) {
    res.status(400).json(err);

  }
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product by ID through endpoints (./api/products/:id)
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        
        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
          .filter((tag_id) => !productTagIds.includes(tag_id))
          .map((tag_id) => {
            return {
              product_id: req.params.id,
              tag_id,
            };
          });

            // figure out which ones to remove
          const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);
                  // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});
//delete a product by id through (./api/products/:id)
router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const deleteOneproduct = await Product.destroy({
      where: {
        id:req.params.id
      }
    });
    if (!deleteOneproduct){
      res.status(404).json({message:"No product with ID exisi"});
      return;
    }
    res.status(200).json(deleteOneproduct);
  } catch {
    res.status(500).json(err);
  }
});

module.exports = router;
