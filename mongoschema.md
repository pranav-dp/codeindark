### Database Collections Structure (EXISTING)

#### users
```javascript
{
  _id: String,
  username: String,
  email: String,
  password: String, // Note: Currently plain text - NEEDS HASHING
  points: Number,
  isActive: Boolean, // default: true, for user banning
  lifelines: [
    {
      lifelineId: String,
      name: String,
      remaining_uses: Number
    }
  ],
  history: {
    lifeline_usage: [
      {
        lifelineId: String,
        name: String,
        points_spent: Number,
        timestamp: Date
      }
    ],
    gambling: [
      {
        game: String, // "spin_wheel" | "dice_roll"
        points_spent: Number,
        points_bet: Number, // for dice
        outcome: String,
        points_won: Number,
        dice_result: Number, // for dice
        timestamp: Date
      }
    ]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### gamblelog
```javascript
{
  _id: String,
  userId: String,
  game: String, // "spin_wheel" | "dice_roll"
  points_spent: Number,
  outcome: String,
  details: Object, // game-specific data
  timestamp: Date
}
```

#### lifelines
```javascript
{
  _id: String,
  name: String,
  description: String,
  point_cost: Number,
  max_uses: Number,
  isActive: Boolean, // default: true, for enabling/disabling lifelines
  createdAt: Date
}
```
